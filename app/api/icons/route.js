import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { rateLimit } from '@/lib/rate-limit';
import { securityHeaders } from '@/lib/api-security';
import { requireProductionMode } from '@/lib/api-middleware';
// getDemoModeUserId removed as it is not needed in production

// Available icon names for use cases
const ICON_NAMES = [
    "Activity", "Airplay", "AlarmClock", "AlertCircle", "Anchor", "Archive",
    "AtSign", "Award", "BarChart", "BatteryCharging", "Bell", "Bluetooth",
    "BookOpen", "Box", "Briefcase", "Calendar", "Camera", "Cast",
    "CheckCircle", "Clipboard", "Clock", "Cloud", "Codepen", "Compass",
    "Copy", "CreditCard", "Database", "Delete", "Disc", "Download",
    "Edit", "ExternalLink", "Eye", "Facebook", "FastForward", "Feather",
    "File", "FileText", "Film", "Filter", "Flag", "Folder",
    "Gift", "GitBranch", "GitCommit", "Github", "Globe", "Grid",
    "HardDrive", "Hash", "Headphones", "Heart", "HelpCircle", "Home",
    "Image", "Inbox", "Info", "Instagram", "Key", "Layers",
    "Layout", "Link", "Linkedin", "List", "Loader", "Lock",
    "LogIn", "LogOut", "Mail", "Map", "MapPin", "Maximize",
    "Menu", "MessageCircle", "Mic", "Minimize", "Monitor", "Moon",
    "MousePointer", "Music", "Navigation", "Package", "Paperclip", "Pause",
    "PenTool", "Percent", "Phone", "PieChart", "Play", "Pocket",
    "Power", "Printer", "Radio", "RefreshCw", "Repeat", "Rewind",
    "Save", "Scissors", "Search", "Send", "Settings", "Share",
    "Shield", "ShoppingCart", "Sidebar", "Slack", "Sliders", "Smartphone",
    "Smile", "Speaker", "Star", "Sun", "Sunrise", "Sunset",
    "Table", "Tablet", "Tag", "Target", "Terminal", "ThumbsUp",
    "ToggleLeft", "Trash", "TrendingUp", "Truck", "Twitter", "Type",
    "Umbrella", "Underline", "Unlock", "Upload", "User", "Video",
    "Voicemail", "Volume2", "Watch", "Wifi", "Wind", "Youtube",
    "Zap"
];

export async function GET(request) {
    const demoBlock = requireProductionMode(request);
    if (demoBlock) return demoBlock;
    // Auth check for Production
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401, headers: securityHeaders }
        );
    }
    const userId = session.user.id;

    // Rate limiting - 60 requests per minute
    const rl = await rateLimit({
        key: `icons:${userId}`,
        limit: 60,
        windowMs: 60 * 1000
    });
    if (!rl.allowed) {
        return NextResponse.json(
            { error: 'Rate limit exceeded', retryAt: rl.resetAt },
            { status: 429, headers: securityHeaders }
        );
    }

    return NextResponse.json({
        icons: ICON_NAMES,
        total: ICON_NAMES.length,
    }, { headers: securityHeaders });
}

