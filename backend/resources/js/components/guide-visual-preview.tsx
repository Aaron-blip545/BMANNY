import {
    BadgeCheck,
    CheckCircle2,
    Clock3,
    ExternalLink,
    FileText,
    Image as ImageIcon,
    MessageSquare,
    Package,
    PackageCheck,
    Search,
    ShieldAlert,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
    Truck,
    UploadCloud,
    UserPlus,
    Users,
    XCircle,
    ArrowRight,
    Building2,
    DollarSign,
    Box,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function GuideVisualPreview({ moduleId }: { moduleId: string }) {
    switch (moduleId) {
        // ─── SALES AGENT ──────────────────────────────────────────────────────────
        case 'sales-inquiries':
            return (
                <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                            <MessageSquare className="h-4 w-4 text-blue-500" />
                            <span>Inquiry Live Chat & One-Click Quotation</span>
                        </div>
                        <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            Live UI Preview
                        </span>
                    </div>

                    {/* Chat Header Mockup */}
                    <div className="flex items-center justify-between p-2 bg-muted/40 rounded-lg border border-border/50 mb-2.5">
                        <div>
                            <span className="text-xs font-bold text-foreground block">Client: Golden Builders</span>
                            <span className="text-[10px] text-muted-foreground">Inquiry #INQ-204 • Safety Helmets</span>
                        </div>
                        <button className="bg-primary text-primary-foreground px-2.5 py-1 rounded-md text-[10px] font-bold inline-flex items-center gap-1 shadow-xs">
                            <FileText className="h-3 w-3" /> + Create Quotation
                        </button>
                    </div>

                    {/* Chat Bubble Thread */}
                    <div className="space-y-2 p-2 bg-muted/20 rounded-lg border border-border/30 mb-2.5 text-[11px]">
                        <div className="flex gap-2 max-w-[80%]">
                            <div className="h-5 w-5 rounded-full bg-blue-500/20 text-blue-600 text-[10px] font-bold flex items-center justify-center shrink-0">C</div>
                            <div className="bg-card border border-border p-2 rounded-xl rounded-tl-none shadow-xs">
                                <p className="text-foreground">Hello! Can we order 150 pcs of yellow safety helmets with our company logo?</p>
                                <span className="text-[9px] text-muted-foreground block text-right mt-0.5">10:14 AM</span>
                            </div>
                        </div>

                        <div className="flex gap-2 max-w-[80%] ml-auto justify-end">
                            <div className="bg-primary text-primary-foreground p-2 rounded-xl rounded-tr-none shadow-xs text-right">
                                <p>Hi! Yes, our MOQ is 50 pcs. I will prepare your custom price quote with logo printing now!</p>
                                <span className="text-[9px] text-primary-foreground/70 block mt-0.5">10:15 AM</span>
                            </div>
                            <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">A</div>
                        </div>
                    </div>

                    {/* Visual Callout */}
                    <div className="rounded-md bg-blue-500/10 border border-blue-500/20 p-2 text-[10px] text-blue-900 dark:text-blue-300">
                        ⚡ <strong>One-Click Workflow:</strong> Click <strong>+ Create Quotation</strong> in the chat header to instantly transfer conversation details into an official pricing proposal!
                    </div>
                </div>
            );

        case 'sales-quotations':
            return (
                <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                            <FileText className="h-4 w-4 text-emerald-500" />
                            <span>Quotation & Payment Proof Verification</span>
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            Live UI Preview
                        </span>
                    </div>

                    {/* Quotation Card Preview */}
                    <div className="rounded-lg border border-border bg-muted/20 p-2.5 mb-2.5 text-xs">
                        <div className="flex items-center justify-between pb-1.5 border-b border-border/50 mb-2">
                            <div>
                                <span className="font-bold text-foreground">Quote #QT-1092</span>
                                <span className="text-[10px] text-muted-foreground block">Client: Prime Logistics Inc.</span>
                            </div>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">₱45,500.00</span>
                        </div>

                        {/* Line items preview */}
                        <div className="text-[10px] space-y-1 mb-2">
                            <div className="flex justify-between text-muted-foreground">
                                <span>• 100x Custom Safety Vests (₱350/ea)</span>
                                <span>₱35,000.00</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>• Reflective Striping & Custom Logo (₱90/ea)</span>
                                <span>₱9,000.00</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>• Bulk Packaging Cartons (10x ₱150)</span>
                                <span>₱1,500.00</span>
                            </div>
                        </div>

                        {/* Payment Proof Section */}
                        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/[0.05] p-2 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2">
                                <span className="h-7 w-7 rounded bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-xs">
                                    📄
                                </span>
                                <div>
                                    <span className="font-semibold text-foreground block text-[11px]">BDO_Bank_Receipt_₱45,500.jpg</span>
                                    <span className="text-[9px] text-emerald-700 dark:text-emerald-400">Uploaded by Client via Mobile App</span>
                                </div>
                            </div>
                            <button className="bg-emerald-600 text-white px-2.5 py-1 rounded text-[10px] font-bold shadow-xs hover:bg-emerald-700">
                                Confirm Payment ✅
                            </button>
                        </div>
                    </div>

                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <span className="font-bold text-foreground">Next Step:</span> Clicking <strong>Confirm Payment</strong> immediately creates the live production order in the Order Manager workspace!
                    </div>
                </div>
            );

        // ─── ORDER MANAGER ────────────────────────────────────────────────────────
        case 'om-orders':
            return (
                <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                            <PackageCheck className="h-4 w-4 text-amber-500" />
                            <span>Production & Delivery Milestone Tracker</span>
                        </div>
                        <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            Live UI Preview
                        </span>
                    </div>

                    {/* Order Milestone Progress Pipeline */}
                    <div className="rounded-lg border border-border bg-muted/20 p-2.5 mb-2.5">
                        <div className="flex items-center justify-between text-xs mb-2">
                            <span className="font-bold text-foreground">Order #BM-4081</span>
                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                In Production
                            </span>
                        </div>

                        {/* Interactive Stepper Visual */}
                        <div className="relative flex items-center justify-between text-center mb-3 px-1">
                            <div className="flex flex-col items-center z-10">
                                <div className="h-5 w-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">✓</div>
                                <span className="text-[9px] font-semibold text-foreground mt-1">Confirmed</span>
                            </div>
                            <div className="h-0.5 flex-1 bg-emerald-500 -mt-3" />

                            <div className="flex flex-col items-center z-10">
                                <div className="h-5 w-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">⚙️</div>
                                <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 mt-1">In Production</span>
                            </div>
                            <div className="h-0.5 flex-1 bg-border -mt-3" />

                            <div className="flex flex-col items-center z-10">
                                <div className="h-5 w-5 rounded-full bg-muted border border-border text-[10px] font-bold flex items-center justify-center text-muted-foreground">3</div>
                                <span className="text-[9px] text-muted-foreground mt-1">Quality QA</span>
                            </div>
                            <div className="h-0.5 flex-1 bg-border -mt-3" />

                            <div className="flex flex-col items-center z-10">
                                <div className="h-5 w-5 rounded-full bg-muted border border-border text-[10px] font-bold flex items-center justify-center text-muted-foreground">4</div>
                                <span className="text-[9px] text-muted-foreground mt-1">Delivery</span>
                            </div>
                        </div>

                        {/* Status Advance Controls */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
                            <span className="text-[10px] text-muted-foreground">100 pcs • Delivery target: Oct 25</span>
                            <button className="bg-primary text-primary-foreground px-2.5 py-1 rounded text-[10px] font-bold inline-flex items-center gap-1 shadow-xs">
                                Advance to Quality QA ➔
                            </button>
                        </div>
                    </div>

                    <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-2 text-[10px] text-amber-900 dark:text-amber-300">
                        🔔 <strong>Real-Time Sync:</strong> Every time you advance an order milestone, the customer's mobile app automatically receives a push notification and live status update!
                    </div>
                </div>
            );

        // ─── PRODUCT CONTROLLER ───────────────────────────────────────────────────
        case 'pc-products':
            return (
                <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                            <Package className="h-4 w-4 text-emerald-500" />
                            <span>Product Catalog Management</span>
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            Live UI Preview
                        </span>
                    </div>

                    {/* Mini Form Mockup */}
                    <div className="grid grid-cols-3 gap-2 p-2 bg-muted/20 rounded-lg border border-border/40 text-[10px] mb-2.5">
                        {/* Image Upload Box */}
                        <div className="rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center p-2 text-center text-muted-foreground">
                            <UploadCloud className="h-5 w-5 text-primary mb-1" />
                            <span className="text-[9px] font-semibold">Drop Product Photo (PNG/JPG)</span>
                        </div>

                        {/* Metadata inputs */}
                        <div className="col-span-2 space-y-1.5">
                            <div>
                                <span className="text-[9px] text-muted-foreground block">Product Title</span>
                                <div className="bg-background px-2 py-1 rounded border border-border text-[11px] font-semibold text-foreground">
                                    Heavy-Duty Industrial Safety Helmet
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                                <div>
                                    <span className="text-[9px] text-muted-foreground block">SKU Code</span>
                                    <div className="bg-background px-2 py-1 rounded border border-border text-[11px] text-foreground">
                                        BM-SH-001
                                    </div>
                                </div>
                                <div>
                                    <span className="text-[9px] text-muted-foreground block">Base Unit Price</span>
                                    <div className="bg-background px-2 py-1 rounded border border-border text-[11px] font-bold text-emerald-600">
                                        ₱350.00
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px]">
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="font-bold text-emerald-800 dark:text-emerald-300">Active Catalog Visibility: ON</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300">Visible to mobile shoppers</span>
                    </div>
                </div>
            );

        case 'pc-moq':
            return (
                <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                            <SlidersHorizontal className="h-4 w-4 text-emerald-500" />
                            <span>MOQ & Bulk Wholesale Discount Tiers</span>
                        </div>
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            Live UI Preview
                        </span>
                    </div>

                    {/* Tiers table */}
                    <div className="rounded-lg border border-border/60 overflow-hidden mb-2 text-[10px]">
                        <div className="grid grid-cols-3 bg-muted/60 p-1.5 font-bold text-muted-foreground border-b border-border/60">
                            <span>Order Quantity</span>
                            <span>Discount %</span>
                            <span>Unit Price</span>
                        </div>
                        <div className="grid grid-cols-3 p-1.5 border-b border-border/30 bg-card">
                            <span className="font-semibold text-foreground">50 – 99 pcs (MOQ)</span>
                            <span className="text-muted-foreground">Standard 0%</span>
                            <span className="font-bold text-foreground">₱350.00 / ea</span>
                        </div>
                        <div className="grid grid-cols-3 p-1.5 border-b border-border/30 bg-emerald-500/[0.04]">
                            <span className="font-semibold text-emerald-800 dark:text-emerald-300">100 – 499 pcs</span>
                            <span className="font-bold text-emerald-600">5% OFF</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-300">₱332.50 / ea</span>
                        </div>
                        <div className="grid grid-cols-3 p-1.5 bg-emerald-500/[0.08]">
                            <span className="font-semibold text-emerald-800 dark:text-emerald-300">500+ pcs (Wholesale)</span>
                            <span className="font-bold text-emerald-600">12% OFF</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-300">₱308.00 / ea</span>
                        </div>
                    </div>

                    <p className="text-[10px] text-muted-foreground">
                        💡 These discount brackets calculate automatically in real-time when Sales Agents draft a quotation!
                    </p>
                </div>
            );

        // ─── ADMIN ────────────────────────────────────────────────────────────────
        case 'admin-users':
            return (
                <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                            <Users className="h-4 w-4 text-purple-500" />
                            <span>Staff Account & Role Creation</span>
                        </div>
                        <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            Live UI Preview
                        </span>
                    </div>

                    {/* Mini User Creator Form */}
                    <div className="rounded-lg border border-border bg-muted/20 p-2.5 mb-2.5 text-xs space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <span className="text-[10px] text-muted-foreground block">Full Name</span>
                                <div className="bg-background px-2 py-1 rounded border border-border text-[11px] font-semibold text-foreground">
                                    Juan Dela Cruz
                                </div>
                            </div>
                            <div>
                                <span className="text-[10px] text-muted-foreground block">Email Address</span>
                                <div className="bg-background px-2 py-1 rounded border border-border text-[11px] text-foreground">
                                    juan.sales@bmanny.com
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <div>
                                <span className="text-[10px] text-muted-foreground block">Assigned Portal Role</span>
                                <div className="bg-background px-2.5 py-1 rounded border border-border text-[11px] font-bold text-blue-600 dark:text-blue-400">
                                    Sales Agent ▾
                                </div>
                            </div>
                            <button className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-[11px] font-bold mt-3 shadow-xs inline-flex items-center gap-1">
                                <UserPlus className="h-3 w-3" /> Save Account
                            </button>
                        </div>
                    </div>

                    <div className="text-[10px] text-muted-foreground">
                        🛡️ Always assign distinct accounts for Sales Agents, Product Controllers, and Order Managers for clear audit logs.
                    </div>
                </div>
            );

        case 'admin-reports':
            return (
                <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-foreground">
                            <FileText className="h-4 w-4 text-purple-500" />
                            <span>Executive Reports & Data Exporting</span>
                        </div>
                        <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            Live UI Preview
                        </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 p-2 bg-muted/30 rounded-lg border border-border/50 text-[10px] mb-2.5">
                        <div className="bg-background px-2.5 py-1 rounded border border-border font-medium text-foreground">
                            Report: Monthly Sales Revenue ▾
                        </div>
                        <div className="bg-background px-2 py-1 rounded border border-border font-medium text-foreground">
                            Period: Last 30 Days 📅 ▾
                        </div>
                        <div className="flex gap-1">
                            <button className="bg-primary text-primary-foreground px-2 py-1 rounded font-bold">
                                CSV 📥
                            </button>
                            <button className="border border-border bg-card px-2 py-1 rounded font-bold">
                                PDF 🖨️
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                        <div className="p-1.5 bg-muted/20 rounded border border-border/30">
                            <span className="block font-bold text-foreground">Revenue Generated</span>
                            <span className="text-xs font-bold text-emerald-600">₱458,200.00</span>
                        </div>
                        <div className="p-1.5 bg-muted/20 rounded border border-border/30">
                            <span className="block font-bold text-foreground">Orders Completed</span>
                            <span className="text-xs font-bold text-primary">34 Orders</span>
                        </div>
                    </div>
                </div>
            );

        default:
            return (
                <div className="rounded-xl border border-border/80 bg-muted/20 p-3 text-xs text-muted-foreground flex items-center justify-center min-h-[90px]">
                    <div className="text-center">
                        <Sparkles className="h-4 w-4 mx-auto text-primary mb-1" />
                        <span className="font-semibold text-foreground text-[11px]">Workspace Visual Guide</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Follow the numbered step-by-step workflow below.</p>
                    </div>
                </div>
            );
    }
}
