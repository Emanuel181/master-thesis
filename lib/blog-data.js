import {
  Shield,
  Code,
  Zap,
  Lock,
  AlertTriangle,
  Bug,
  Eye,
  Key,
  Server,
  Database,
  Globe,
  Wifi,
  Terminal,
  FileCode,
  GitBranch,
  Cloud,
  Cpu,
  HardDrive,
} from "lucide-react";

// Blog posts are now stored in the database
// This array is kept empty for backward compatibility
export const blogPosts = [];

// Returns the icon component for a given icon name
export const getIconComponent = (iconName) => {
  const icons = {
    AlertTriangle,
    Shield,
    Code,
    Zap,
    Lock,
    Bug,
    Eye,
    Key,
    Server,
    Database,
    Globe,
    Wifi,
    Terminal,
    FileCode,
    GitBranch,
    Cloud,
    Cpu,
    HardDrive,
  };
  return icons[iconName] || Shield;
};

// Legacy functions - kept for backward compatibility but return empty results
// All blog data is now fetched from the database

export const getBlogPost = (slug) => {
  return blogPosts.find(post => post.slug === slug);
};

export const getAllSlugs = () => {
  return blogPosts.map(post => post.slug);
};
