# Step Functions state machine for workflow orchestration

resource "aws_sfn_state_machine" "run_workflow" {
  name     = "${var.environment}-run-workflow"
  role_arn = aws_iam_role.step_functions.arn
  
  definition = jsonencode({
    Comment = "Security Assessment Run Workflow"
    StartAt = "InitializeRun"
    States = {
      InitializeRun = {
        Type     = "Task"
        Resource = aws_lambda_function.initialize_run.arn
        ResultPath = "$.runContext"
        Next     = "EmitRunStarted"
        Catch = [{
          ErrorEquals = ["States.ALL"]
          ResultPath  = "$.error"
          Next        = "HandleError"
        }]
      }
      
      EmitRunStarted = {
        Type = "Task"
        Resource = "arn:aws:states:::events:putEvents"
        Parameters = {
          Entries = [{
            Source     = "orchestrator"
            DetailType = "run_started"
            Detail = {
              "runId.$"         = "$.runId"
              "userId.$"        = "$.userId"
              "totalUseCases.$" = "$.runContext.useCaseCount"
            }
            EventBusName = aws_cloudwatch_event_bus.orchestrator.name
          }]
        }
        ResultPath = null
        Next       = "ProcessUseCases"
      }
      
      ProcessUseCases = {
        Type           = "Map"
        ItemsPath      = "$.runContext.useCases"
        MaxConcurrency = 3
        Iterator = {
          StartAt = "EmitUseCaseStarted"
          States = {
            EmitUseCaseStarted = {
              Type = "Task"
              Resource = "arn:aws:states:::events:putEvents"
              Parameters = {
                Entries = [{
                  Source     = "orchestrator"
                  DetailType = "usecase_started"
                  Detail = {
                    "runId.$"      = "$.runId"
                    "useCaseId.$"  = "$$.Map.Item.Value.id"
                    "useCaseName.$" = "$$.Map.Item.Value.title"
                  }
                  EventBusName = aws_cloudwatch_event_bus.orchestrator.name
                }]
              }
              ResultPath = null
              Next       = "ExecuteReviewer"
            }
            
            ExecuteReviewer = {
              Type     = "Task"
              Resource = aws_lambda_function.agent_reviewer.arn
              Parameters = {
                "runId.$"           = "$.runId"
                "useCase.$"         = "$$.Map.Item.Value"
                "knowledgeBaseId.$" = "$$.Map.Item.Value.knowledgeBaseId"
              }
              ResultPath = "$.reviewerOutput"
              Next       = "CheckFixerEnabled"
              TimeoutSeconds = 900
              Retry = [{
                ErrorEquals     = ["States.TaskFailed"]
                IntervalSeconds = 5
                MaxAttempts     = 2
                BackoffRate     = 2.0
              }]
            }

            CheckFixerEnabled = {
              Type = "Choice"
              Choices = [{
                Variable      = "$$.Map.Item.Value.enableFixer"
                BooleanEquals = true
                Next          = "ExecuteFixer"
              }]
              Default = "CheckImplementerEnabled"
            }

            ExecuteFixer = {
              Type     = "Task"
              Resource = aws_lambda_function.agent_fixer.arn
              Parameters = {
                "runId.$"          = "$.runId"
                "useCase.$"        = "$$.Map.Item.Value"
                "reviewerOutput.$" = "$.reviewerOutput"
              }
              ResultPath = "$.fixerOutput"
              Next       = "CheckImplementerEnabled"
              TimeoutSeconds = 900
              Catch = [{
                ErrorEquals     = ["States.ALL"]
                ResultPath      = "$.fixerError"
                Next            = "CheckImplementerEnabled"
              }]
            }

            CheckImplementerEnabled = {
              Type = "Choice"
              Choices = [{
                Variable      = "$$.Map.Item.Value.enableImplementer"
                BooleanEquals = true
                Next          = "ExecuteImplementer"
              }]
              Default = "ExecuteTester"
            }
            
            ExecuteImplementer = {
              Type     = "Task"
              Resource = aws_lambda_function.agent_implementer.arn
              Parameters = {
                "runId.$"          = "$.runId"
                "useCase.$"        = "$$.Map.Item.Value"
                "reviewerOutput.$" = "$.reviewerOutput"
              }
              ResultPath = "$.implementerOutput"
              Next       = "ExecuteTester"
              TimeoutSeconds = 900
            }
            
            ExecuteTester = {
              Type = "Parallel"
              Branches = [
                {
                  # EC2-based pentester (existing)
                  StartAt = "EC2Pentester"
                  States = {
                    EC2Pentester = {
                      Type     = "Task"
                      Resource = "arn:aws:states:::sqs:sendMessage.waitForTaskToken"
                      Parameters = {
                        QueueUrl = aws_sqs_queue.pentester_jobs.url
                        MessageBody = {
                          "taskToken.$"         = "$$.Task.Token"
                          "runId.$"             = "$.runId"
                          "useCase.$"           = "$$.Map.Item.Value"
                          "reviewerOutput.$"    = "$.reviewerOutput"
                          "implementerOutput.$" = "$.implementerOutput"
                        }
                      }
                      ResultPath     = "$.ec2PentestOutput"
                      TimeoutSeconds = 3600
                      End            = true
                      Catch = [{
                        ErrorEquals = ["States.ALL"]
                        ResultPath  = "$.ec2PentestError"
                        Next        = "EC2PentestFailed"
                      }]
                    }
                    EC2PentestFailed = {
                      Type = "Pass"
                      Result = { status = "failed", message = "EC2 pentest failed" }
                      End = true
                    }
                  }
                },
                {
                  # Autonomous pentest infrastructure (new)
                  StartAt = "CheckPentestEnabled"
                  States = {
                    CheckPentestEnabled = {
                      Type = "Choice"
                      Choices = [{
                        Variable = "$$.Map.Item.Value.testerModel"
                        IsPresent = true
                        Next = "ExecuteAutonomousPentest"
                      }]
                      Default = "SkipAutonomousPentest"
                    }
                    ExecuteAutonomousPentest = {
                      Type     = "Task"
                      Resource = aws_lambda_function.agent_tester_pentest.arn
                      Parameters = {
                        "runId.$"             = "$.runId"
                        "userId.$"            = "$.userId"
                        "useCase.$"           = "$$.Map.Item.Value"
                        "code.$"              = "$$.Map.Item.Value.code"
                        "codeType.$"          = "$$.Map.Item.Value.codeType"
                        "testerPrompt.$"      = "$$.Map.Item.Value.testerPrompt"
                        "testerModel.$"       = "$$.Map.Item.Value.testerModel"
                        "reviewerOutput.$"    = "$.reviewerOutput"
                        "fixerOutput.$"       = "$.fixerOutput"
                      }
                      ResultPath     = "$.autonomousPentestOutput"
                      TimeoutSeconds = 900
                      End            = true
                      Catch = [{
                        ErrorEquals = ["States.ALL"]
                        ResultPath  = "$.autonomousPentestError"
                        Next        = "AutonomousPentestFailed"
                      }]
                    }
                    SkipAutonomousPentest = {
                      Type = "Pass"
                      Result = { status = "skipped", message = "Autonomous pentest not configured" }
                      End = true
                    }
                    AutonomousPentestFailed = {
                      Type = "Pass"
                      Result = { status = "failed", message = "Autonomous pentest failed" }
                      End = true
                    }
                  }
                }
              ]
              ResultPath = "$.testerOutputs"
              Next       = "MergeTesterResults"
              Catch = [{
                ErrorEquals = ["States.ALL"]
                ResultPath  = "$.testerError"
                Next        = "ExecuteReporter"
              }]
            }

            MergeTesterResults = {
              Type = "Pass"
              Parameters = {
                "ec2Results.$"        = "$.testerOutputs[0]"
                "autonomousResults.$" = "$.testerOutputs[1]"
                "combinedStatus"      = "completed"
              }
              ResultPath = "$.testerOutput"
              Next       = "ExecuteReporter"
            }

            ExecuteReporter = {
              Type     = "Task"
              Resource = aws_lambda_function.agent_reporter.arn
              Parameters = {
                "runId.$"             = "$.runId"
                "useCase.$"           = "$$.Map.Item.Value"
                "reviewerOutput.$"    = "$.reviewerOutput"
                "implementerOutput.$" = "$.implementerOutput"
                "testerOutput.$"      = "$.testerOutput"
              }
              ResultPath = "$.reporterOutput"
              Next       = "EmitUseCaseFinished"
              TimeoutSeconds = 600
            }
            
            EmitUseCaseFinished = {
              Type = "Task"
              Resource = "arn:aws:states:::events:putEvents"
              Parameters = {
                Entries = [{
                  Source     = "orchestrator"
                  DetailType = "usecase_finished"
                  Detail = {
                    "runId.$"     = "$.runId"
                    "useCaseId.$" = "$$.Map.Item.Value.id"
                    status        = "completed"
                  }
                  EventBusName = aws_cloudwatch_event_bus.orchestrator.name
                }]
              }
              ResultPath = null
              End        = true
            }
          }
        }
        ResultPath = "$.useCaseResults"
        Next       = "EmitRunFinished"
      }
      
      EmitRunFinished = {
        Type = "Task"
        Resource = "arn:aws:states:::events:putEvents"
        Parameters = {
          Entries = [{
            Source     = "orchestrator"
            DetailType = "run_finished"
            Detail = {
              "runId.$" = "$.runId"
              status    = "completed"
            }
            EventBusName = aws_cloudwatch_event_bus.orchestrator.name
          }]
        }
        ResultPath = null
        Next       = "Success"
      }
      
      Success = {
        Type = "Succeed"
      }
      
      HandleError = {
        Type = "Task"
        Resource = "arn:aws:states:::events:putEvents"
        Parameters = {
          Entries = [{
            Source     = "orchestrator"
            DetailType = "run_failed"
            Detail = {
              "runId.$" = "$.runId"
              "error.$" = "$.error"
            }
            EventBusName = aws_cloudwatch_event_bus.orchestrator.name
          }]
        }
        Next = "Fail"
      }
      
      Fail = {
        Type = "Fail"
      }
    }
  })
  
  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.step_functions.arn}:*"
    include_execution_data = true
    level                  = "ALL"
  }
  
  tags = {
    Name = "${var.environment}-run-workflow"
  }
}

resource "aws_cloudwatch_log_group" "step_functions" {
  name              = "/aws/vendedlogs/states/${var.environment}-run-workflow"
  retention_in_days = 30
  
  tags = {
    Name = "${var.environment}-step-functions-logs"
  }
}
