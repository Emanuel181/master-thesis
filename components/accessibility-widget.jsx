"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAccessibility } from "@/contexts/accessibilityContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Accessibility,
  Type,
  Palette,
  MousePointer2,
  Eye,
  EyeOff,
  RotateCcw,
  Minus,
  Plus,
  Sun,
  Moon,
  Contrast,
  Link2,
  Heading,
  BookOpen,
  Pause,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  PersonStanding,
} from "lucide-react";

export function AccessibilityWidget() {
  const {
    mounted,
    isOpen,
    setIsOpen,
    settings,
    updateSetting,
    resetSettings,
    position,
    setPosition,
    savePosition,
    forceHideFloating,
  } = useAccessibility();

  const isMobile = useIsMobile();
  const [isDragging, setIsDragging] = useState(false);
  const buttonRef = useRef(null);
  const hasMoved = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  // Dragging logic for mouse
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    hasMoved.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };

    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      initialPos.current = { x: rect.left, y: rect.top };
    }

    const handleMouseMove = (e) => {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;

      if (!hasMoved.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        hasMoved.current = true;
      }

      if (hasMoved.current) {
        let newX = initialPos.current.x + dx;
        let newY = initialPos.current.y + dy;

        // Bounds
        newX = Math.max(0, Math.min(newX, window.innerWidth - 60));
        newY = Math.max(0, Math.min(newY, window.innerHeight - 60));

        setPosition({ x: newX, y: newY, bottom: null });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      setIsDragging(false);

      if (hasMoved.current) {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (rect) {
          const newPos = { x: rect.left, y: rect.top, bottom: null };
          savePosition(newPos);
        }
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [setPosition, savePosition]);

  // Touch event handlers for mobile drag support
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    setIsDragging(true);
    hasMoved.current = false;
    dragStart.current = { x: touch.clientX, y: touch.clientY };

    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      initialPos.current = { x: rect.left, y: rect.top };
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStart.current.x;
    const dy = touch.clientY - dragStart.current.y;

    if (!hasMoved.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      hasMoved.current = true;
    }

    if (hasMoved.current) {
      e.preventDefault(); // Prevent scrolling while dragging
      let newX = initialPos.current.x + dx;
      let newY = initialPos.current.y + dy;

      // Bounds
      newX = Math.max(0, Math.min(newX, window.innerWidth - 60));
      newY = Math.max(0, Math.min(newY, window.innerHeight - 60));

      setPosition({ x: newX, y: newY, bottom: null });
    }
  }, [isDragging, setPosition]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);

    if (hasMoved.current) {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        const newPos = { x: rect.left, y: rect.top, bottom: null };
        savePosition(newPos);
      }
    }
  }, [savePosition]);

  // Add/remove touch event listeners
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    button.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      button.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleTouchMove]);

  const handleClick = useCallback((e) => {
    if (hasMoved.current) {
      e.preventDefault();
      e.stopPropagation();
      setTimeout(() => {
        hasMoved.current = false;
      }, 0);
      return;
    }
    setIsOpen(true);
  }, [setIsOpen]);

  const buttonStyle =
    position.y !== null
      ? { left: position.x, top: position.y }
      : { left: position.x, bottom: position.bottom };

  // Don't render anything on server or if floating button is hidden
  if (!mounted) return null;

  // Use portal to render at document.body level to avoid z-index issues
  return createPortal(
    <>
      {/* Floating Button - only show if not hidden by settings or page-level override */}
      {!settings.hideFloatingButton && !forceHideFloating && (
        <button
          ref={buttonRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={handleClick}
          className={cn(
            "fixed w-14 h-14 rounded-full overflow-hidden",
            "shadow-lg shadow-black/20",
            !isDragging && "hover:shadow-xl hover:scale-105 transition-all duration-200",
            "cursor-grab active:cursor-grabbing",
            "flex items-center justify-center",
            "focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] focus:ring-offset-2",
            "a11y-widget-button",
            "touch-none" // Prevent default touch behavior while dragging
          )}
          style={{ 
            ...buttonStyle, 
            zIndex: 2147483647,
            background: "linear-gradient(135deg, var(--brand-accent) 0%, var(--brand-primary) 100%)"
          }}
          aria-label="Open accessibility menu"
          title={isMobile ? "Accessibility options (touch and drag to move)" : "Accessibility options (drag to move)"}
        >
          <PersonStanding className="w-7 h-7 text-white" strokeWidth={2.5} />
        </button>
      )}

      {/* Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          style={{ zIndex: 2147483646 }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-full sm:w-[400px] bg-background border-r border-border shadow-2xl",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ zIndex: 2147483647 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Accessibility className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-white text-lg font-semibold">Accessibility</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetSettings}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[calc(100vh-130px)]">
          <div className="p-4">
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-4">
                <TabsTrigger value="content" className="text-xs sm:text-sm">
                  <Type className="w-4 h-4 mr-1" />
                  Content
                </TabsTrigger>
                <TabsTrigger value="color" className="text-xs sm:text-sm">
                  <Palette className="w-4 h-4 mr-1" />
                  Color
                </TabsTrigger>
                <TabsTrigger value="tools" className="text-xs sm:text-sm">
                  <MousePointer2 className="w-4 h-4 mr-1" />
                  Tools
                </TabsTrigger>
              </TabsList>

              {/* Content Tab */}
              <TabsContent value="content" className="space-y-6 mt-0">
                {/* Font Size */}
                <SettingGroup title="Font Size" icon={Type}>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateSetting("fontSize", Math.max(50, settings.fontSize - 10))}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Slider
                      value={[settings.fontSize]}
                      onValueChange={([v]) => updateSetting("fontSize", v)}
                      min={50}
                      max={200}
                      step={10}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateSetting("fontSize", Math.min(200, settings.fontSize + 10))}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <span className="w-12 text-sm text-center font-medium">{settings.fontSize}%</span>
                  </div>
                </SettingGroup>

                {/* Line Height */}
                <SettingGroup title="Line Height" icon={Type}>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[settings.lineHeight]}
                      onValueChange={([v]) => updateSetting("lineHeight", v)}
                      min={100}
                      max={200}
                      step={10}
                      className="flex-1"
                    />
                    <span className="w-12 text-sm text-center font-medium">{settings.lineHeight}%</span>
                  </div>
                </SettingGroup>

                {/* Letter Spacing */}
                <SettingGroup title="Letter Spacing" icon={Type}>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[settings.letterSpacing]}
                      onValueChange={([v]) => updateSetting("letterSpacing", v)}
                      min={0}
                      max={10}
                      step={1}
                      className="flex-1"
                    />
                    <span className="w-12 text-sm text-center font-medium">{settings.letterSpacing}px</span>
                  </div>
                </SettingGroup>

                {/* Word Spacing */}
                <SettingGroup title="Word Spacing" icon={Type}>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[settings.wordSpacing]}
                      onValueChange={([v]) => updateSetting("wordSpacing", v)}
                      min={0}
                      max={20}
                      step={2}
                      className="flex-1"
                    />
                    <span className="w-12 text-sm text-center font-medium">{settings.wordSpacing}px</span>
                  </div>
                </SettingGroup>

                <Separator />

                {/* Font Options */}
                <ToggleSetting
                  label="Bold Text"
                  description="Make all text bolder"
                  icon={Type}
                  checked={settings.fontWeight}
                  onCheckedChange={(v) => updateSetting("fontWeight", v)}
                />

                <ToggleSetting
                  label="Dyslexia Friendly Font"
                  description="Use OpenDyslexic font"
                  icon={BookOpen}
                  checked={settings.dyslexiaFont}
                  onCheckedChange={(v) => updateSetting("dyslexiaFont", v)}
                />

                <Separator />

                {/* Text Alignment */}
                <SettingGroup title="Text Alignment" icon={AlignLeft}>
                  <div className="flex gap-2">
                    {[
                      { value: "default", label: "Default", Icon: null },
                      { value: "left", label: "Left", Icon: AlignLeft },
                      { value: "center", label: "Center", Icon: AlignCenter },
                      { value: "right", label: "Right", Icon: AlignRight },
                    ].map(({ value, label, Icon }) => (
                      <Button
                        key={value}
                        variant="outline"
                        size="sm"
                        onClick={() => updateSetting("textAlign", value)}
                        className={cn(
                          settings.textAlign === value && "bg-[var(--brand-accent)] text-white border-[var(--brand-accent)]"
                        )}
                      >
                        {Icon ? <Icon className="w-4 h-4" /> : label}
                      </Button>
                    ))}
                  </div>
                </SettingGroup>
              </TabsContent>

              {/* Color Tab */}
              <TabsContent value="color" className="space-y-6 mt-0">
                {/* Contrast Modes */}
                <SettingGroup title="Contrast Mode" icon={Contrast}>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "none", label: "Default", icon: Eye },
                      { value: "dark", label: "Dark", icon: Moon },
                      { value: "light", label: "Light", icon: Sun },
                      { value: "high", label: "High Contrast", icon: Contrast },
                    ].map(({ value, label, icon: Icon }) => (
                      <Button
                        key={value}
                        variant="outline"
                        size="sm"
                        onClick={() => updateSetting("contrastMode", value)}
                        className={cn(
                          "justify-start gap-2",
                          settings.contrastMode === value && "bg-[var(--brand-accent)] text-white border-[var(--brand-accent)]"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </SettingGroup>

                {/* Saturation */}
                <SettingGroup title="Color Saturation" icon={Palette}>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[settings.saturation]}
                      onValueChange={([v]) => updateSetting("saturation", v)}
                      min={0}
                      max={200}
                      step={10}
                      className="flex-1"
                    />
                    <span className="w-12 text-sm text-center font-medium">{settings.saturation}%</span>
                  </div>
                </SettingGroup>

                <Separator />

                <ToggleSetting
                  label="Highlight Links"
                  description="Add visible outlines to links"
                  icon={Link2}
                  checked={settings.highlightLinks}
                  onCheckedChange={(v) => updateSetting("highlightLinks", v)}
                />

                <ToggleSetting
                  label="Highlight Headings"
                  description="Add visible backgrounds to headings"
                  icon={Heading}
                  checked={settings.highlightHeadings}
                  onCheckedChange={(v) => updateSetting("highlightHeadings", v)}
                />
              </TabsContent>

              {/* Tools Tab */}
              <TabsContent value="tools" className="space-y-4 mt-0">
                <ToggleSetting
                  label="Reading Guide"
                  description="Show a horizontal line that follows cursor"
                  icon={BookOpen}
                  checked={settings.readingGuide}
                  onCheckedChange={(v) => updateSetting("readingGuide", v)}
                />

                <ToggleSetting
                  label="Big Cursor"
                  description="Increase cursor size for better visibility"
                  icon={MousePointer2}
                  checked={settings.bigCursor}
                  onCheckedChange={(v) => updateSetting("bigCursor", v)}
                />

                <ToggleSetting
                  label="Stop Animations"
                  description="Disable all animations and transitions"
                  icon={Pause}
                  checked={settings.stopAnimations}
                  onCheckedChange={(v) => updateSetting("stopAnimations", v)}
                />

                <ToggleSetting
                  label="Focus Indicator"
                  description="Add visible focus outlines"
                  icon={Eye}
                  checked={settings.focusIndicator}
                  onCheckedChange={(v) => updateSetting("focusIndicator", v)}
                />

                <Separator />

                {/* Floating Button Visibility */}
                <ToggleSetting
                  label="Hide Floating Button"
                  description="Hide the floating button (use navbar icon instead)"
                  icon={settings.hideFloatingButton ? EyeOff : Eye}
                  checked={settings.hideFloatingButton}
                  onCheckedChange={(v) => updateSetting("hideFloatingButton", v)}
                />
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t bg-muted/50 text-center safe-area-bottom">
          <p className="text-xs text-muted-foreground">
            Settings are saved automatically
          </p>
        </div>
      </div>
    </>,
    document.body
  );
}

// Navbar Accessibility Button Component
export function AccessibilityNavButton({ className }) {
  const { openPanel } = useAccessibility();

  return (
    <button
      onClick={openPanel}
      className={cn(
        "flex items-center justify-center w-9 h-9 rounded-full",
        "bg-gradient-to-br from-[var(--brand-accent)]/20 to-[var(--brand-primary)]/20",
        "hover:from-[var(--brand-accent)]/30 hover:to-[var(--brand-primary)]/30",
        "border border-[var(--brand-accent)]/30",
        "transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)] focus:ring-offset-2",
        className
      )}
      aria-label="Open accessibility menu"
      title="Accessibility options"
    >
      <PersonStanding className="w-5 h-5 text-[var(--brand-accent)]" strokeWidth={2} />
    </button>
  );
}

// Helper Components
function SettingGroup({ title, icon: Icon, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-[var(--brand-accent)]" />}
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <div className="pl-6 space-y-2">{children}</div>
    </div>
  );
}

function ToggleSetting({ label, description, icon: Icon, checked, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-4 h-4 text-[var(--brand-accent)]" />}
        <div>
          <Label className="text-sm font-medium cursor-pointer">{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
