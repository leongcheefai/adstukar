export { Badge, badgeVariants } from "./primitives/badge";
export { Button, buttonVariants } from "./primitives/button";
export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./primitives/card";
export { Input } from "./primitives/input";
export { Label } from "./primitives/label";
export { Textarea } from "./primitives/textarea";
export { Toaster } from "./primitives/sonner";
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./primitives/select";
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./primitives/dialog";
export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
} from "./primitives/sheet";

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./primitives/dropdown-menu";

export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./primitives/tooltip";

export { cn } from "./lib/utils";
export { DashboardShell } from "./patterns/dashboard-shell";
export type { NavItem, DashboardShellProps } from "./patterns/dashboard-shell";
export { Hero } from "./patterns/hero";
export type { HeroProps } from "./patterns/hero";
export { FeatureSection } from "./patterns/feature-section";
export type { Feature, FeatureSectionProps } from "./patterns/feature-section";
export { PricingCard } from "./patterns/pricing-card";
export type { PricingCardProps, PricingTier } from "./patterns/pricing-card";
export { LogoCloud } from "./patterns/logo-cloud";
export type { LogoCloudProps, LogoEntry } from "./patterns/logo-cloud";
export { Testimonial } from "./patterns/testimonial";
export type { TestimonialProps } from "./patterns/testimonial";
export { FAQ } from "./patterns/faq";
export type { FAQItem, FAQProps } from "./patterns/faq";
export { MobileNavDrawer } from "./patterns/mobile-nav-drawer";
export type { MobileNavDrawerProps } from "./patterns/mobile-nav-drawer";
export { DashboardTopbar } from "./patterns/dashboard-topbar";
export type { DashboardTopbarProps } from "./patterns/dashboard-topbar";

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants } from "./primitives/tabs";
export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
} from "./primitives/avatar";
export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./primitives/alert-dialog";
export { Separator } from "./primitives/separator";
export { Switch } from "./primitives/switch";
export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "./primitives/chart";
export type { ChartConfig } from "./primitives/chart";
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./primitives/table";

// Footer
export { Footer } from "./patterns/footer";
export type { FooterProps, FooterGroup, FooterLink } from "./patterns/footer";

// Layout primitives
export { Section } from "./patterns/layout/section";
export type { SectionProps } from "./patterns/layout/section";
export { Container } from "./patterns/layout/container";
export type { ContainerProps } from "./patterns/layout/container";
export { SectionHeader } from "./patterns/layout/section-header";
export type { SectionHeaderProps } from "./patterns/layout/section-header";

// toast re-export for islands that need it without adding sonner as direct dep
export { toast } from "sonner";

export { Eyebrow } from "./primitives/eyebrow";
export { Kbd } from "./primitives/kbd";
export { EmptyState } from "./primitives/empty-state";
export type { EmptyStateProps } from "./primitives/empty-state";
export { Logo } from "./primitives/logo";
export type { LogoProps } from "./primitives/logo";
