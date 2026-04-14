# Shannon Repository — Push Instructions

## Problem
`Emanuel181` (this machine) does not have push access to `KeygraphHQ/shannon.git`.
The `emanueland` account (other laptop) does have access.

There are 2 local commits that need to be pushed — they delete old sample reports and deliverables (11 files, ~6K lines removed).

## Commits to push
```
06ef05d m — deletes CLAUDE.md, COVERAGE.md, sample-reports/
11bee8c m — deletes old deliverables (comprehensive report, recon, injection)
```

## Instructions (on the other laptop — emanueland account)

### Step 1: Clone or pull latest
```bash
git clone https://github.com/KeygraphHQ/shannon.git
cd shannon
# or if already cloned:
cd shannon && git pull origin main
```

### Step 2: Copy the patch file
Copy `shannon-changes.patch` from this machine to the other laptop.
The file is at: `infrastructure/aws/shannon/shannon-changes.patch`

### Step 3: Apply the patch
```bash
git am < shannon-changes.patch
```

### Step 4: Push
```bash
git push origin main
```

## Done
After pushing, you can delete `shannon-changes.patch` and this file.
