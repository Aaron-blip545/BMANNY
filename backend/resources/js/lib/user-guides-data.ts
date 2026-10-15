export interface GuideModule {
    id: string;
    title: string;
    iconName: string;
    route: string;
    summary: string;
    whenToUse: string;
    steps: {
        number: number;
        title: string;
        description: string;
    }[];
    tips: string[];
    badge?: string;
}

export interface RoleGuide {
    roleId: 'admin' | 'sales_agent' | 'product_controller' | 'order_manager';
    roleName: string;
    badgeColor: string;
    headline: string;
    description: string;
    modules: GuideModule[];
}

export const USER_GUIDES: Record<string, RoleGuide> = {
    admin: {
        roleId: 'admin',
        roleName: 'Admin',
        badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        headline: 'System Administration & Strategic Oversight',
        description:
            'As an Administrator, you oversee business health, manage team member accounts, monitor financial and sales reports, and supervise the entire inquiry-to-order pipeline.',
        modules: [
            {
                id: 'admin-dashboard',
                title: 'Admin Dashboard & Analytics',
                iconName: 'BarChart3',
                route: '/admin/dashboard',
                summary: 'Real-time overview of revenue, sales volume, inquiry conversions, and team activity.',
                whenToUse: 'Check every morning to review daily progress, total sales figures, and operational bottlenecks.',
                steps: [
                    {
                        number: 1,
                        title: 'Review Executive KPI Cards',
                        description: 'Check total revenue, active orders in production, pending customer inquiries, and registered clients.',
                    },
                    {
                        number: 2,
                        title: 'Analyze Sales & Order Trends',
                        description: 'View monthly revenue charts and conversion rates to gauge company growth.',
                    },
                    {
                        number: 3,
                        title: 'Inspect Department Status',
                        description: 'Identify if Sales, Production, or Inventory has any pending review backlogs.',
                    },
                ],
                tips: [
                    'Use the Analytics page (/admin/analytics) for granular multi-month comparisons.',
                    'Click any metric card to jump directly to that department workspace.',
                ],
            },
            {
                id: 'admin-users',
                title: 'User Management',
                iconName: 'UsersIcon',
                route: '/users',
                summary: 'Create, update, deactivate staff accounts and assign system permissions.',
                whenToUse: 'When onboarding a new staff member, updating employee details, or managing client accounts.',
                steps: [
                    {
                        number: 1,
                        title: 'Add a New Team Member',
                        description: 'Click "+ Create User" at the top right of the Users page.',
                    },
                    {
                        number: 2,
                        title: 'Assign Appropriate Role',
                        description: 'Choose between Sales Agent, Order Manager, Product Controller, or Admin.',
                    },
                    {
                        number: 3,
                        title: 'Manage Existing Accounts',
                        description: 'Edit employee phone/email, reset passwords, or deactivate accounts when team members leave.',
                    },
                ],
                tips: [
                    'Always create individual accounts for staff instead of sharing logins for clear audit trails.',
                    'Deactivating a user instantly revokes their portal session without deleting their past activity logs.',
                ],
            },
            {
                id: 'admin-reports',
                title: 'Reports & Exports',
                iconName: 'FileText',
                route: '/admin/reports',
                summary: 'Generate, filter, and export comprehensive sales, inventory, and order reports.',
                whenToUse: 'At end-of-month, quarterly reviews, or for tax and accounting audits.',
                steps: [
                    {
                        number: 1,
                        title: 'Choose Report Category',
                        description: 'Select between Sales Revenue, Inventory Valuation, Order Performance, or Client Activity.',
                    },
                    {
                        number: 2,
                        title: 'Apply Date Range & Filters',
                        description: 'Pick specific dates, product categories, or order statuses.',
                    },
                    {
                        number: 3,
                        title: 'Export Data',
                        description: 'Click Export to download spreadsheet CSV or print-ready PDF summaries.',
                    },
                ],
                tips: [
                    'Scheduled recurring reviews help identify top-performing products and inventory deadstock early.',
                ],
            },
            {
                id: 'admin-moderation',
                title: 'Chat Moderation',
                iconName: 'ShieldAlert',
                route: '/moderation/messages',
                summary: 'Review flagged or hidden messages in customer inquiry chats to uphold business standards.',
                whenToUse: 'When the automated content filter flags inappropriate words or external payment requests in chats.',
                steps: [
                    {
                        number: 1,
                        title: 'Inspect Flagged Queue',
                        description: 'Review the list of flagged customer and agent messages.',
                    },
                    {
                        number: 2,
                        title: 'Examine Conversation Context',
                        description: 'Click to view the full dialogue leading up to the flagged snippet.',
                    },
                    {
                        number: 3,
                        title: 'Take Action',
                        description: 'Keep the message hidden, or unflag if it was a false positive.',
                    },
                ],
                tips: [
                    'Chat moderation protects both the company and clients from unverified off-platform transactions.',
                ],
            },
        ],
    },

    sales_agent: {
        roleId: 'sales_agent',
        roleName: 'Sales Agent',
        badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        headline: 'Customer Engagement, Quotations & Client Onboarding',
        description:
            'As a Sales Agent, you are the primary face of BMANNY. You respond to customer inquiries from the mobile app, prepare customized price quotations, and guide clients to payment.',
        modules: [
            {
                id: 'sales-dashboard',
                title: 'Sales Dashboard',
                iconName: 'House',
                route: '/sales/dashboard',
                summary: 'Your daily workspace showing pending messages, quotes awaiting review, and deal pipelines.',
                whenToUse: 'Start here every day to prioritize urgent customer inquiries and follow up on pending payments.',
                steps: [
                    {
                        number: 1,
                        title: 'Check Awaiting Inquiries',
                        description: 'Look at the top alerts for prospective clients waiting for answers.',
                    },
                    {
                        number: 2,
                        title: 'Monitor Quotation Statuses',
                        description: 'Identify quotations that were sent to clients vs. quotations with uploaded payment proofs.',
                    },
                    {
                        number: 3,
                        title: 'Follow Up on Quotations',
                        description: 'Check active quotations and customer replies to guide them toward order placement.',
                    },
                ],
                tips: [
                    'Responding to inquiries within 5 minutes increases conversion rates by over 40%!',
                ],
            },
            {
                id: 'sales-inquiries',
                title: 'Inquiries & Live Chat',
                iconName: 'CircleHelp',
                route: '/inquiries',
                summary: 'Chat in real-time with prospective clients regarding product inquiries and custom orders.',
                whenToUse: 'Whenever a customer reaches out from the mobile app with questions about products or bulk orders.',
                steps: [
                    {
                        number: 1,
                        title: 'Open Active Conversation',
                        description: 'Select an inquiry from the customer list to open the live chat window.',
                    },
                    {
                        number: 2,
                        title: 'Discuss Specifications',
                        description: 'Answer customer questions about materials, colors, logos, and target delivery dates.',
                    },
                    {
                        number: 3,
                        title: 'Request Feasibility (If Custom)',
                        description: 'If the customer asks for a non-standard item, send a quick Product Request to the Product Controller.',
                    },
                    {
                        number: 4,
                        title: 'Convert Chat to Quotation',
                        description: 'Click "Create Quotation" directly inside the inquiry header to turn agreement into a formal quote.',
                    },
                ],
                tips: [
                    'Use polite, professional phrasing and confirm exact quantities before preparing quotes.',
                    'Keep chats active until the quotation is issued.',
                ],
            },
            {
                id: 'sales-quotations',
                title: 'Quotations & Payment Review',
                iconName: 'FileText',
                route: '/quotations',
                summary: 'Issue formal price proposals and verify customer payment receipts.',
                whenToUse: 'To send pricing breakdowns to clients and confirm payments before orders go to production.',
                steps: [
                    {
                        number: 1,
                        title: 'Create Quotation',
                        description: 'Click "+ New Quotation", select the client, and add desired products, packaging, and custom finishes.',
                    },
                    {
                        number: 2,
                        title: 'Send to Mobile App',
                        description: 'Submit the quotation. The client will instantly receive a notification on their mobile phone.',
                    },
                    {
                        number: 3,
                        title: 'Review Proof of Payment',
                        description: 'When the customer uploads their payment slip (bank transfer/GCash), click "View Proof" to verify receipt details.',
                    },
                    {
                        number: 4,
                        title: 'Confirm Payment',
                        description: 'Click "Confirm Payment" to automatically convert the approved quote into a live Order for the factory team!',
                    },
                ],
                tips: [
                    'Always check that the reference number and amount on the receipt match the quotation total exactly.',
                    'If the receipt is unclear, click "Reject Payment" with a note requesting a clearer photo.',
                ],
            },
        ],
    },

    product_controller: {
        roleId: 'product_controller',
        roleName: 'Product Controller',
        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        headline: 'Catalog Custodian, Packaging, MOQ & Customization',
        description:
            'As a Product Controller, you curate the product catalog, determine minimum order quantities, set bulk discount tiers, approve custom requests from Sales, and configure available finishes.',
        modules: [
            {
                id: 'pc-dashboard',
                title: 'Controller Dashboard',
                iconName: 'House',
                route: '/product-controller/dashboard',
                summary: 'Catalog health, stock alerts, and pending customization requests from Sales.',
                whenToUse: 'Check daily for new feasibility requests and out-of-stock items needing attention.',
                steps: [
                    {
                        number: 1,
                        title: 'Check Pending Requests',
                        description: 'Review custom product review tickets submitted by Sales Agents.',
                    },
                    {
                        number: 2,
                        title: 'Monitor Low-Stock Alerts',
                        description: 'Ensure popular items have adequate stock before agents quote high quantities.',
                    },
                ],
                tips: [
                    'Fast request reviews keep sales deals moving without losing customer momentum.',
                ],
            },
            {
                id: 'pc-products',
                title: 'Product Management',
                iconName: 'Package',
                route: '/product-controller/products',
                summary: 'Add, edit, organize, and toggle catalog items displayed on the mobile app.',
                whenToUse: 'When introducing new merchandise, modifying prices, or updating product specifications.',
                steps: [
                    {
                        number: 1,
                        title: 'Add New Product',
                        description: 'Click "+ Add Product", enter product name, category, SKU, and base price.',
                    },
                    {
                        number: 2,
                        title: 'Upload Product Media',
                        description: 'Provide clear, professional product photos with transparent or clean backgrounds.',
                    },
                    {
                        number: 3,
                        title: 'Set Visibility',
                        description: 'Toggle Active status to publish the product live to all mobile app shoppers.',
                    },
                ],
                tips: [
                    'Include detailed dimensions, weight, and material descriptions to reduce customer questions.',
                ],
            },
            {
                id: 'pc-requests',
                title: 'Product Requests Review',
                iconName: 'ClipboardCheck',
                route: '/product-controller/requests',
                summary: 'Evaluate feasibility and determine pricing for non-standard custom client requests.',
                whenToUse: 'When a Sales Agent sends a custom request ticket from a customer inquiry.',
                steps: [
                    {
                        number: 1,
                        title: 'Review Client Specifications',
                        description: 'Read the customer requirements (materials, dimensions, target quantity).',
                    },
                    {
                        number: 2,
                        title: 'Confirm Feasibility with Production',
                        description: 'Verify if materials are available and calculate production costs.',
                    },
                    {
                        number: 3,
                        title: 'Approve or Suggest Alternative',
                        description: 'Approve with updated unit pricing, or reject with alternative suggestions.',
                    },
                ],
                tips: [
                    'Provide clear notes in the response so the Sales Agent can explain choices directly to the client.',
                ],
            },
            {
                id: 'pc-packaging',
                title: 'Packaging Management',
                iconName: 'Box',
                route: '/product-controller/packaging',
                summary: 'Configure packaging options (Gift Box, Bulk Carton, Shrink Wrap, Eco Bag).',
                whenToUse: 'To add or edit packaging options and their associated additional costs.',
                steps: [
                    {
                        number: 1,
                        title: 'Create Packaging Option',
                        description: 'Enter packaging title, description, and fee per unit or batch.',
                    },
                    {
                        number: 2,
                        title: 'Link to Categories',
                        description: 'Select which product types support this packaging.',
                    },
                ],
                tips: [
                    'Offering premium packaging options creates an easy upsell opportunity for corporate gifting orders.',
                ],
            },
            {
                id: 'pc-moq',
                title: 'MOQ & Bulk Tier Pricing',
                iconName: 'SlidersHorizontal',
                route: '/product-controller/moq',
                summary: 'Define Minimum Order Quantities and tiered volume discounts.',
                whenToUse: 'To enforce production minimums and incentivize higher quantity orders.',
                steps: [
                    {
                        number: 1,
                        title: 'Set Base Minimum Order Quantity',
                        description: 'Define the lowest allowable quantity for production runs (e.g. 50 pcs).',
                    },
                    {
                        number: 2,
                        title: 'Configure Tier Discounts',
                        description: 'Add volume tiers (e.g. 100 pcs = 5% off, 500 pcs = 12% off, 1000 pcs = 20% off).',
                    },
                ],
                tips: [
                    'Volume discounts are automatically calculated during quotation creation, saving sales agents time.',
                ],
            },
            {
                id: 'pc-customization',
                title: 'Customization Options',
                iconName: 'CircleHelp',
                route: '/product-controller/customization',
                summary: 'Define available branding and finishing methods (Engraving, Silk Screen, UV Print).',
                whenToUse: 'To configure branding techniques, setup fees, and additional lead times.',
                steps: [
                    {
                        number: 1,
                        title: 'Add Finish Technique',
                        description: 'Enter method name (e.g. Laser Engraving, Embroidery, Heat Press).',
                    },
                    {
                        number: 2,
                        title: 'Specify Cost & Lead Time',
                        description: 'Set per-piece finishing charge and days required for completion.',
                    },
                ],
                tips: [
                    'Clearly specify maximum print dimensions and allowed color counts for each method.',
                ],
            },
        ],
    },

    order_manager: {
        roleId: 'order_manager',
        roleName: 'Order Manager',
        badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        headline: 'Production Pipeline, Quality Control & Fulfillment',
        description:
            'As an Order Manager, you oversee factory production after payment confirmation, manage order milestones, conduct quality inspections, and coordinate delivery with couriers.',
        modules: [
            {
                id: 'om-dashboard',
                title: 'Order Manager Dashboard',
                iconName: 'House',
                route: '/order-manager/dashboard',
                summary: 'High-level status of all active orders, delivery deadlines, and production stages.',
                whenToUse: 'Daily to prioritize jobs nearing deadlines and identify assembly line delays.',
                steps: [
                    {
                        number: 1,
                        title: 'Check Production Stages',
                        description: 'View orders sorted by: Confirmed, In Production, QA Inspection, Ready for Delivery.',
                    },
                    {
                        number: 2,
                        title: 'Identify Approaching Deadlines',
                        description: 'Prioritize orders with delivery target dates in the next 24-48 hours.',
                    },
                    {
                        number: 3,
                        title: 'Inspect Low Inventory Alerts',
                        description: 'Verify raw materials before commencing next batch.',
                    },
                ],
                tips: [
                    'Keep orders flowing systematically through stages to prevent bottlenecking at delivery dispatch.',
                ],
            },
            {
                id: 'om-orders',
                title: 'Orders Pipeline & Tracking',
                iconName: 'PackageCheck',
                route: '/orders',
                summary: 'Detailed order cards with item specs, client contacts, and milestone updating.',
                whenToUse: 'To update order progress as manufacturing and packing milestones are reached.',
                steps: [
                    {
                        number: 1,
                        title: 'Open Confirmed Order',
                        description: 'Review confirmed quotation specs, customization choices, and client shipping address.',
                    },
                    {
                        number: 2,
                        title: 'Advance Status Milestones',
                        description: 'Update status as work progresses: "In Production" → "Quality Inspection" → "Ready for Delivery".',
                    },
                    {
                        number: 3,
                        title: 'Quality Check & Packing',
                        description: 'Inspect finished goods against order specs before boxing.',
                    },
                    {
                        number: 4,
                        title: 'Dispatch & Complete',
                        description: 'Enter shipping carrier/courier details and mark "Out for Delivery" → "Completed".',
                    },
                ],
                tips: [
                    'Every milestone change automatically sends a real-time push notification to the client’s mobile app!',
                    'Always verify shipping address before dispatching courier.',
                ],
            },
            {
                id: 'om-inventory',
                title: 'Inventory & Stock Monitor',
                iconName: 'PackageMinus',
                route: '/products',
                summary: 'Monitor stock counts of finished goods and raw materials used in orders.',
                whenToUse: 'Before scheduling large production runs to ensure sufficient materials are available.',
                steps: [
                    {
                        number: 1,
                        title: 'Search Product / Material',
                        description: 'Look up specific inventory items by name or SKU.',
                    },
                    {
                        number: 2,
                        title: 'Review Stock Levels',
                        description: 'Check available quantity vs. reserved quantity for active orders.',
                    },
                ],
                tips: [
                    'Report unexpected stock shortages immediately to the Product Controller.',
                ],
            },
        ],
    },
};
