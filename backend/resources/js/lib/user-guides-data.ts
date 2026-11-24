export interface GuideStep {
    number: number;
    title: string;
    description: string;
}

export interface GuideModule {
    id: string;
    stageLabel: string;
    title: string;
    shortTitle: string;
    iconName: string;
    route: string;
    summary: string;
    whenToUse: string;
    nextConnector?: string;
    imageSrc?: string;
    imageCaption?: string;
    missingImageHint?: string;
    steps: GuideStep[];
    tips: string[];
}

export interface RoleGuide {
    roleId: 'admin' | 'sales_agent' | 'product_controller' | 'order_manager';
    roleName: string;
    headline: string;
    description: string;
    modules: GuideModule[];
}

export const USER_GUIDES: Record<string, RoleGuide> = {
    sales_agent: {
        roleId: 'sales_agent',
        roleName: 'Sales Agent',
        headline: 'Customer Engagement, Inquiries & Quotations Flow',
        description:
            'Follow this visual flowchart from monitoring your daily dashboard and checking raw material availability to chatting with clients, issuing quotations, and confirming payments.',
        modules: [
            {
                id: 'sales-dashboard',
                stageLabel: 'Stage 01',
                title: 'Sales Agent Dashboard',
                shortTitle: 'Dashboard',
                iconName: 'House',
                route: '/sales/dashboard',
                summary:
                    'The Sales Agent Dashboard provides a quick overview of inquiries, quotations, clients, sales performance, and order progress.',
                whenToUse: 'Start your shift here to check pending inquiries, quotation pipeline metrics, and recent client activity.',
                nextConnector: 'Verify stock before quoting',
                imageSrc: '/images/user-guide/sales-dashboard.png',
                imageCaption:
                    'The Sales Agent Dashboard provides a quick overview of inquiries, quotations, clients, sales performance, and order progress.',
                steps: [
                    {
                        number: 1,
                        title: 'Check KPI Cards',
                        description: 'Review total inquiries, pending reviews, quotations created, and registered business clients.',
                    },
                    {
                        number: 2,
                        title: 'Scan Recent Activity',
                        description: 'Inspect the latest customer inquiry submissions and jump straight in via Quick Access.',
                    },
                    {
                        number: 3,
                        title: 'Track Sales Pipeline',
                        description: 'Monitor demand charts, order statuses, and top buyer forecasts.',
                    },
                ],
                tips: ['Responding to new inquiries quickly significantly improves client conversion rates.'],
            },
            {
                id: 'sales-inventory',
                stageLabel: 'Stage 02',
                title: 'Raw Materials Inventory (View-Only)',
                shortTitle: 'Inventory',
                iconName: 'PackageMinus',
                route: '/products',
                summary:
                    'The Inventory tab provides a view-only list of raw materials, including stock quantities, categories, unit prices, and stock statuses.',
                whenToUse: 'Check material stock levels before promising turnaround times or preparing bulk quotations.',
                nextConnector: 'Respond to client requests',
                imageSrc: '/images/user-guide/sales-inventory.png',
                imageCaption:
                    'The Inventory tab provides a view-only list of raw materials, including stock quantities, categories, unit prices, and stock statuses.',
                steps: [
                    {
                        number: 1,
                        title: 'Review Stock Summary',
                        description: 'Check total materials, in-stock count, reorder alerts, and out-of-stock warnings.',
                    },
                    {
                        number: 2,
                        title: 'Search Material or SKU',
                        description: 'Filter by category (Flavors, Packaging Types, etc.) or status to confirm availability.',
                    },
                    {
                        number: 3,
                        title: 'Verify Unit Rates',
                        description: 'Reference current stock on hand and unit pricing before quoting custom packages.',
                    },
                ],
                tips: ['If a required raw material is Out of Stock, coordinate with the Product Controller before sending a quote.'],
            },
            {
                id: 'sales-inquiries',
                stageLabel: 'Stage 03',
                title: 'Customer Inquiries & Live Chat',
                shortTitle: 'Inquiries',
                iconName: 'CircleHelp',
                route: '/inquiries',
                summary:
                    'The Inquiries tab displays customer requests, their details, package information, review status, and allows sales agents to chat with customers, resend reviews, and create quotations.',
                whenToUse: 'Whenever a client submits a rebranding or packaging inquiry from the mobile app.',
                nextConnector: 'Convert approved inquiry to quote',
                imageSrc: '/images/user-guide/sales-inquiries.png',
                imageCaption:
                    'The Inquiries tab displays customer requests, their details, package information, review status, and allows sales agents to chat with customers, resend reviews, and create quotations.',
                steps: [
                    {
                        number: 1,
                        title: 'Inspect Inquiry Details',
                        description: 'Review business name, contact info, selected package, and Product Controller review status.',
                    },
                    {
                        number: 2,
                        title: 'Open Live Chat',
                        description: 'Click Chat to clarify flavors, packaging sizes, custom labels, or schedule follow-ups.',
                    },
                    {
                        number: 3,
                        title: 'Forward / Resend Review',
                        description: 'Send custom specifications to the Product Controller if availability needs confirmation.',
                    },
                    {
                        number: 4,
                        title: 'Launch Quotation',
                        description: 'Click Quote directly on the inquiry row once specifications are finalized.',
                    },
                ],
                tips: [
                    'Always confirm exact quantities and packaging finishes in chat before issuing a quotation.',
                ],
            },
            {
                id: 'sales-quotations',
                stageLabel: 'Stage 04',
                title: 'Quotations & Payment Verification',
                shortTitle: 'Quotations',
                iconName: 'FileText',
                route: '/quotations',
                summary:
                    'The Quotations tab allows sales agents to select customer inquiries, set pricing and validity dates, add item details and notes, and send quotations to clients.',
                whenToUse: 'To prepare formal pricing proposals, send them to the mobile app, and verify uploaded payment receipts.',
                imageSrc: '/images/user-guide/sales-quotations.png',
                imageCaption:
                    'The Quotations tab allows sales agents to select customer inquiries, set pricing and validity dates, add item details and notes, and send quotations to clients.',
                steps: [
                    {
                        number: 1,
                        title: 'Select Customer Inquiry',
                        description: 'Choose the client inquiry so requested package and customization details prefill automatically.',
                    },
                    {
                        number: 2,
                        title: 'Set Amount & Validity',
                        description: 'Enter total pricing, validity date, payment terms, and clear item breakdown notes.',
                    },
                    {
                        number: 3,
                        title: 'Send to Client',
                        description: 'Submit the quotation so the client receives it immediately on the BMANNY mobile app.',
                    },
                    {
                        number: 4,
                        title: 'Verify Payment Proof',
                        description: 'Inspect uploaded payment receipts and approve to convert the quote into a live production order.',
                    },
                ],
                tips: [
                    'Double-check reference numbers and payment amounts before confirming a client receipt.',
                ],
            },
        ],
    },

    product_controller: {
        roleId: 'product_controller',
        roleName: 'Product Controller',
        headline: 'Catalog, Raw Materials, BOM & Request Feasibility Flow',
        description:
            'Follow this visual workflow to monitor product configurations, maintain raw materials inventory, configure finished products (BOM, packaging, MOQ), and review forwarded sales requests.',
        modules: [
            {
                id: 'pc-dashboard',
                stageLabel: 'Stage 01',
                title: 'Product Controller Dashboard',
                shortTitle: 'Dashboard',
                iconName: 'House',
                route: '/product-controller/dashboard',
                summary:
                    'The Product Controller Dashboard provides an overview of product configurations, availability, MOQ requirements, recent updates, and product configuration status.',
                whenToUse: 'Start here to spot configurations needing MOQ review, unavailable products, and recent catalog edits.',
                nextConnector: 'Audit raw materials stock',
                imageSrc: '/images/user-guide/pc-dashboard.png',
                imageCaption:
                    'The Product Controller Dashboard provides an overview of product configurations, availability, MOQ requirements, recent updates, and product configuration status.',
                steps: [
                    {
                        number: 1,
                        title: 'Check Configuration KPIs',
                        description: 'Review total configurations, available vs. unavailable counts, and MOQ attention alerts.',
                    },
                    {
                        number: 2,
                        title: 'Inspect Recent Updates',
                        description: 'Audit the latest catalog changes and timestamps in the Recent Product Updates table.',
                    },
                    {
                        number: 3,
                        title: 'Resolve MOQ Attention',
                        description: 'Identify products missing MOQ rules and update them promptly.',
                    },
                ],
                tips: ['Keeping MOQ and availability updated prevents quoting delays for the Sales team.'],
            },
            {
                id: 'pc-inventory',
                stageLabel: 'Stage 02',
                title: 'Raw Materials Inventory',
                shortTitle: 'Inventory',
                iconName: 'PackageMinus',
                route: '/products',
                summary:
                    'The Inventory tab allows the Product Controller to add, edit, delete, and monitor raw materials, including stock quantities, unit prices, reorder levels, and availability.',
                whenToUse: 'When restocking ingredients or packaging materials, adjusting unit rates, or adding new raw materials.',
                nextConnector: 'Configure finished products & BOM',
                imageSrc: '/images/user-guide/pc-inventory.png',
                imageCaption:
                    'The Inventory tab allows the Product Controller to add, edit, delete, and monitor raw materials, including stock quantities, unit prices, reorder levels, and availability.',
                steps: [
                    {
                        number: 1,
                        title: 'Monitor Reorder Alerts',
                        description: 'Check Reorder Alert and Out of Stock KPI cards at the top of the page.',
                    },
                    {
                        number: 2,
                        title: 'Add or Edit Materials',
                        description: 'Click "+ Add Raw Material" or use row Edit buttons to update stock on hand and unit rates.',
                    },
                    {
                        number: 3,
                        title: 'Keep SKUs Organized',
                        description: 'Assign accurate categories and reorder thresholds so production shortages are caught early.',
                    },
                ],
                tips: ['Raw material stock is automatically checked when Order Managers move orders into production.'],
            },
            {
                id: 'pc-products',
                stageLabel: 'Stage 03',
                title: 'Product Management (Catalog, BOM & MOQ)',
                shortTitle: 'Products & BOM',
                iconName: 'Package',
                route: '/product-controller/products',
                summary:
                    'The Product Management tab allows the Product Controller to manage finished products, including product details, categories, formulations (BOM), packaging options, suggested prices, and minimum order quantities (MOQ).',
                whenToUse: 'To add finished products, link raw material BOM recipes, and manage packaging, customization, and MOQ.',
                nextConnector: 'Review forwarded sales requests',
                imageSrc: '/images/user-guide/pc-products.png',
                imageCaption:
                    'The Product Management tab allows the Product Controller to manage finished products, including product details, categories, formulations (BOM), packaging options, suggested prices, and minimum order quantities (MOQ).',
                steps: [
                    {
                        number: 1,
                        title: 'Add Finished Product',
                        description: 'Click "+ Add Finished Product" to define name, code, category, suggested SRP, and media.',
                    },
                    {
                        number: 2,
                        title: 'Configure BOM Recipe',
                        description: 'Click the BOM button on any product row to map required raw materials and compute unit cost.',
                    },
                    {
                        number: 3,
                        title: 'Set Packaging & MOQ',
                        description: 'Maintain packaging options, customization finishes, and minimum order quantities.',
                    },
                ],
                tips: ['Accurate BOM recipes ensure automatic inventory deduction works smoothly during production.'],
            },
            {
                id: 'pc-requests',
                stageLabel: 'Stage 04',
                title: 'Product Requests Review',
                shortTitle: 'Product Requests',
                iconName: 'ClipboardCheck',
                route: '/product-controller/requests',
                summary:
                    'The Product Requests tab allows the Product Controller to review requests forwarded by Sales Agents, confirm product availability, and provide alternative options.',
                whenToUse: 'Whenever a Sales Agent forwards a custom client inquiry for technical feasibility review.',
                nextConnector: 'Stay updated on alerts',
                imageSrc: '/images/user-guide/pc-requests.png',
                imageCaption:
                    'The Product Requests tab allows the Product Controller to review requests forwarded by Sales Agents, confirm product availability, and provide alternative options.',
                steps: [
                    {
                        number: 1,
                        title: 'Open Pending Ticket',
                        description: 'Review the forwarded client specifications, requested packaging, and target volume.',
                    },
                    {
                        number: 2,
                        title: 'Check Material Feasibility',
                        description: 'Confirm whether required ingredients and packaging are available in inventory.',
                    },
                    {
                        number: 3,
                        title: 'Approve or Suggest Alternative',
                        description: 'Mark as available or send back a recommended alternative with clear notes for Sales.',
                    },
                ],
                tips: ['Fast feasibility responses help Sales Agents send accurate quotations without losing momentum.'],
            },
            {
                id: 'pc-notifications',
                stageLabel: 'Stage 05',
                title: 'Notifications Center',
                shortTitle: 'Notifications',
                iconName: 'Bell',
                route: '/notifications/page',
                summary: 'Central feed of real-time alerts for newly forwarded product requests and inventory updates.',
                whenToUse: 'Check whenever the top-bar notification bell shows unread alerts.',
                missingImageHint: 'Product Controller — Notifications page (/notifications/page)',
                steps: [
                    {
                        number: 1,
                        title: 'Review Unread Alerts',
                        description: 'Open Notifications from the sidebar or top bell icon to view incoming updates.',
                    },
                    {
                        number: 2,
                        title: 'Act & Mark as Read',
                        description: 'Jump to the related request or mark resolved alerts as read to keep your queue clean.',
                    },
                ],
                tips: ['Use "Mark all read" after clearing your daily review queue.'],
            },
        ],
    },

    order_manager: {
        roleId: 'order_manager',
        roleName: 'Order Manager',
        headline: 'Order Fulfillment, Production & Delivery Flow',
        description:
            'Follow this visual pipeline from monitoring approved orders on your dashboard to verifying raw material stock and advancing orders through production, pickup, and completion.',
        modules: [
            {
                id: 'om-dashboard',
                stageLabel: 'Stage 01',
                title: 'Order Manager Dashboard',
                shortTitle: 'Dashboard',
                iconName: 'House',
                route: '/order-manager/dashboard',
                summary:
                    'The Order Manager Dashboard provides an overview of order fulfillment, including approved orders, production status, delivery progress, and recent order activities.',
                whenToUse: 'Check daily to prioritize newly approved orders ready for production and monitor recent status updates.',
                nextConnector: 'Verify raw materials before production',
                imageSrc: '/images/user-guide/om-dashboard.png',
                imageCaption:
                    'The Order Manager Dashboard provides an overview of order fulfillment, including approved orders, production status, delivery progress, and recent order activities.',
                steps: [
                    {
                        number: 1,
                        title: 'Review Stage Counters',
                        description: 'Check Approved, In Production, and For Delivery counts at the top of the dashboard.',
                    },
                    {
                        number: 2,
                        title: 'Inspect Recent Order Activity',
                        description: 'Track the latest completed and ready-for-pickup milestones across clients.',
                    },
                    {
                        number: 3,
                        title: 'Use Quick Access',
                        description: 'Jump directly into Orders or Inventory with one click.',
                    },
                ],
                tips: ['Prioritize Approved orders each morning so factory batches stay on schedule.'],
            },
            {
                id: 'om-inventory',
                stageLabel: 'Stage 02',
                title: 'Raw Materials Inventory (View-Only)',
                shortTitle: 'Inventory',
                iconName: 'PackageMinus',
                route: '/products',
                summary:
                    'The Order Manager Inventory tab provides a view-only overview of raw materials, including stock quantities, categories, unit prices, reorder levels, and availability.',
                whenToUse: 'Before moving an Approved order into In Production, verify that required raw materials are in stock.',
                nextConnector: 'Advance production & delivery status',
                imageSrc: '/images/user-guide/om-inventory.png',
                imageCaption:
                    'The Order Manager Inventory tab provides a view-only overview of raw materials, including stock quantities, categories, unit prices, reorder levels, and availability.',
                steps: [
                    {
                        number: 1,
                        title: 'Check Shortage Indicators',
                        description: 'Scan Reorder Alert and Out of Stock cards before scheduling large batches.',
                    },
                    {
                        number: 2,
                        title: 'Search Required Materials',
                        description: 'Look up specific ingredients or packaging containers by name or SKU.',
                    },
                    {
                        number: 3,
                        title: 'Flag Shortages Early',
                        description: 'Notify the Product Controller immediately if a batch lacks sufficient materials.',
                    },
                ],
                tips: ['The system will automatically alert you with a shortage breakdown if inventory is insufficient to start production.'],
            },
            {
                id: 'om-orders',
                stageLabel: 'Stage 03',
                title: 'Orders Pipeline & Delivery Tracking',
                shortTitle: 'Orders',
                iconName: 'PackageCheck',
                route: '/orders',
                summary:
                    'The Orders tab allows the Order Manager to monitor orders, track production and delivery statuses, update order progress, and manage courier and tracking information.',
                whenToUse: 'To advance orders from Approved → In Production → Ready for Pickup / Delivery → Completed and record tracking numbers.',
                imageSrc: '/images/user-guide/om-orders.png',
                imageCaption:
                    'The Orders tab allows the Order Manager to monitor orders, track production and delivery statuses, update order progress, and manage courier and tracking information.',
                steps: [
                    {
                        number: 1,
                        title: 'Filter or Search Order',
                        description: 'Find orders by client name, order number, tracking number, or status filter.',
                    },
                    {
                        number: 2,
                        title: 'Update Production Status',
                        description: 'Choose the next milestone in the Update Status dropdown and click Update.',
                    },
                    {
                        number: 3,
                        title: 'Enter Courier & Tracking',
                        description: 'Fill in the courier (e.g., J&T, LBC) and tracking number for dispatch.',
                    },
                    {
                        number: 4,
                        title: 'Complete Fulfillment',
                        description: 'Mark the order Completed once delivered or picked up by the client.',
                    },
                ],
                tips: ['Every status update automatically notifies the client on their BMANNY mobile app.'],
            },
        ],
    },

    admin: {
        roleId: 'admin',
        roleName: 'Admin',
        headline: 'Full System Oversight, Operations & Administration Flow',
        description:
            'Follow this visual administration flowchart to supervise system health, manage inventory, monitor inquiries, quotations, and orders, analyze reports, and manage staff accounts.',
        modules: [
            {
                id: 'admin-dashboard',
                stageLabel: 'Stage 01',
                title: 'Admin Dashboard',
                shortTitle: 'Dashboard',
                iconName: 'House',
                route: '/admin/dashboard',
                summary:
                    'The Admin Dashboard provides an overview of system activities, including registered users, customer inquiries, confirmed orders, products, and recent customer activity.',
                whenToUse: 'Check daily to monitor overall business activity across all departments.',
                nextConnector: 'Monitor factory raw materials',
                imageSrc: '/images/user-guide/admin-dashboard.png',
                imageCaption:
                    'The Admin Dashboard provides an overview of system activities, including registered users, customer inquiries, confirmed orders, products, and recent customer activity.',
                steps: [
                    {
                        number: 1,
                        title: 'Review System KPIs',
                        description: 'Check total registered accounts, customer inquiries, confirmed orders, and catalog products.',
                    },
                    {
                        number: 2,
                        title: 'Scan Recent Activity',
                        description: 'Inspect latest customer inquiry activity and response statuses in real time.',
                    },
                ],
                tips: ['Use the sidebar to drill down into any department workspace immediately.'],
            },
            {
                id: 'admin-inventory',
                stageLabel: 'Stage 02',
                title: 'Admin Inventory Management',
                shortTitle: 'Inventory',
                iconName: 'PackageMinus',
                route: '/products',
                summary:
                    'The Admin Inventory tab allows administrators to manage raw materials, monitor stock levels, add or edit materials, and track reorder alerts and out-of-stock items.',
                whenToUse: 'To oversee factory raw materials, add new stock, or adjust unit rates and reorder alerts.',
                nextConnector: 'Review customer inquiries',
                imageSrc: '/images/user-guide/admin-inventory.png',
                imageCaption:
                    'The Admin Inventory tab allows administrators to manage raw materials, monitor stock levels, add or edit materials, and track reorder alerts and out-of-stock items.',
                steps: [
                    {
                        number: 1,
                        title: 'Check Stock Health',
                        description: 'Monitor In Stock, Reorder Alert, and Out of Stock counters.',
                    },
                    {
                        number: 2,
                        title: 'Add or Update Materials',
                        description: 'Click "+ Add Raw Material" or use row actions to edit stock quantities and pricing.',
                    },
                ],
                tips: ['Regularly reviewing Out of Stock items prevents production bottlenecks.'],
            },
            {
                id: 'admin-inquiries',
                stageLabel: 'Stage 03',
                title: 'Admin Inquiries Oversight',
                shortTitle: 'Inquiries',
                iconName: 'CircleHelp',
                route: '/inquiries',
                summary:
                    'The Admin Inquiries tab allows administrators to monitor customer inquiries, review request details, track statuses, communicate with customers, and create quotations.',
                whenToUse: 'To supervise active sales conversations, audit response speed, or step in on escalated client requests.',
                nextConnector: 'Verify quotations & payments',
                imageSrc: '/images/user-guide/admin-inquiries.png',
                imageCaption:
                    'The Admin Inquiries tab allows administrators to monitor customer inquiries, review request details, track statuses, communicate with customers, and create quotations.',
                steps: [
                    {
                        number: 1,
                        title: 'Track Inquiry Statuses',
                        description: 'Filter inquiries by Total, Pending, Responded, or Closed status.',
                    },
                    {
                        number: 2,
                        title: 'Open Chat or Quote',
                        description: 'Inspect client chat threads, resend product reviews, or issue quotations directly.',
                    },
                ],
                tips: ['Admins can also moderate or close conversations from inside the chat thread.'],
            },
            {
                id: 'admin-quotations',
                stageLabel: 'Stage 04',
                title: 'Admin Quotations & Payment Review',
                shortTitle: 'Quotations',
                iconName: 'FileText',
                route: '/quotations',
                summary:
                    'The Admin Quotations tab allows administrators to monitor customer quotations, review payment statuses, verify submitted payments, and approve quotations before order creation.',
                whenToUse: 'To audit issued quotes, inspect payment receipts, and confirm order conversions.',
                nextConnector: 'Track production & orders',
                imageSrc: '/images/user-guide/admin-quotations.png',
                imageCaption:
                    'The Admin Quotations tab allows administrators to monitor customer quotations, review payment statuses, verify submitted payments, and approve quotations before order creation.',
                steps: [
                    {
                        number: 1,
                        title: 'Review Quote Pipeline',
                        description: 'Check Awaiting Payment, Payment Submitted, and Accepted quotation counts.',
                    },
                    {
                        number: 2,
                        title: 'Inspect Payment Receipts',
                        description: 'Open initial and balance payment receipts to verify client transfers.',
                    },
                    {
                        number: 3,
                        title: 'Approve to Create Order',
                        description: 'Approve verified quotations to forward them automatically to the Orders pipeline.',
                    },
                ],
                tips: ['Keep payment receipts verified promptly so Order Managers can begin production on time.'],
            },
            {
                id: 'admin-orders',
                stageLabel: 'Stage 05',
                title: 'Orders Pipeline',
                shortTitle: 'Orders',
                iconName: 'PackageCheck',
                route: '/orders',
                summary: 'Supervise all confirmed orders from production start through courier dispatch and completion.',
                whenToUse: 'To track fulfillment progress or update order statuses and courier details.',
                nextConnector: 'Analyze performance & trends',
                imageSrc: '/images/user-guide/admin-orders.png',
                imageCaption:
                    'The Admin Orders tab lets administrators monitor Approved, In Production, Ready for Pickup, Completed, and Cancelled orders, update statuses, and record delivery tracking.',
                steps: [
                    {
                        number: 1,
                        title: 'Monitor Order Statuses',
                        description: 'Track Approved, In Production, Ready for Pickup, Completed, and Cancelled orders.',
                    },
                    {
                        number: 2,
                        title: 'Update Milestones & Tracking',
                        description: 'Advance statuses, cancel if needed, and record courier tracking details directly in each row.',
                    },
                ],
                tips: ['Use search and status filters to quickly locate specific clients or order numbers.'],
            },
            {
                id: 'admin-analytics',
                stageLabel: 'Stage 06',
                title: 'Business Analytics',
                shortTitle: 'Analytics',
                iconName: 'BarChart3',
                route: '/admin/analytics',
                summary: 'Inspect demand charts, order status breakdown, conversion pipeline, and total order value.',
                whenToUse: 'For daily, weekly, monthly, or yearly executive performance reviews.',
                nextConnector: 'Export or import reports',
                imageSrc: '/images/user-guide/admin-analytics.png',
                imageCaption:
                    'The Admin Analytics tab shows business activity at a glance across Daily, Weekly, Monthly, and Yearly ranges, including Demand, Order Status, Pipeline, and Order Value.',
                steps: [
                    {
                        number: 1,
                        title: 'Choose Timeframe',
                        description: 'Switch between Daily, Weekly, Monthly, and Yearly filters at the top right.',
                    },
                    {
                        number: 2,
                        title: 'Review Demand & Pipeline',
                        description: 'Compare inquiries vs. orders, check conversion counts, and monitor total order value.',
                    },
                ],
                tips: ['Compare Monthly vs. Yearly trends to spot seasonal demand peaks early.'],
            },
            {
                id: 'admin-reports',
                stageLabel: 'Stage 07',
                title: 'Reports & Exports',
                shortTitle: 'Reports',
                iconName: 'FileText',
                route: '/admin/reports',
                summary: 'Generate, filter, and export CSV/PDF reports or import structured templates.',
                whenToUse: 'For end-of-month summaries, accounting records, and bulk data imports.',
                nextConnector: 'Manage staff & client accounts',
                missingImageHint: 'Admin — Reports (/admin/reports)',
                steps: [
                    {
                        number: 1,
                        title: 'Select Report Type',
                        description: 'Choose inquiries, quotations, or orders to export or download import templates.',
                    },
                    {
                        number: 2,
                        title: 'Export or Import Data',
                        description: 'Download spreadsheets for recordkeeping or upload validated import files.',
                    },
                ],
                tips: ['Download CSV reports monthly for clean financial recordkeeping.'],
            },
            {
                id: 'admin-users',
                stageLabel: 'Stage 08',
                title: 'Manage Users & Roles',
                shortTitle: 'Manage Users',
                iconName: 'UsersIcon',
                route: '/users',
                summary: 'Provision staff and customer accounts, assign roles, edit credentials, and activate or deactivate access.',
                whenToUse: 'When onboarding new team members, updating role assignments, or revoking access.',
                missingImageHint: 'Admin — Manage Users directory (/users)',
                steps: [
                    {
                        number: 1,
                        title: 'Provision New Account',
                        description: 'Click "Provision Account" to create a new Admin, Sales Agent, Order Manager, Product Controller, or Customer.',
                    },
                    {
                        number: 2,
                        title: 'Filter & Manage Access',
                        description: 'Search accounts by name, email, or role, edit details, or deactivate inactive logins.',
                    },
                ],
                tips: ['Deactivating a user immediately revokes active tokens and prevents new logins.'],
            },
        ],
    },
};
