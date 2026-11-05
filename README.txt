STOREOFGAMES – Rich UI update

Included pages (replace the corresponding files in your GitHub Pages root):
- homepage.html
- configLoad.html (Add Product)
- ManageItems.html
- AddItems.html (Add Stock)
- RemoveItems.html (Sales Billing)
- AdminReports.html
- DetailedReports.html

Shared stylesheets:
- store-ui.css: shared theme, colour tokens, cards, controls, feedback states and responsive rules.
- DetailedReports.css: layout rules specific to Detailed Reports.

IMPORTANT:
1. Extract all files into the same folder as your existing auth.js, config.js and storemanage.js.
2. Replace the matching HTML files and add both CSS files.
3. Do not replace auth.js, config.js or storemanage.js with older copies. Keep your current working versions.
4. Business logic, Supabase calls, RPC names and database operations were not intentionally changed. This update focuses on shared presentation and responsive layout.
5. Test each page on desktop and mobile, especially scanner, modal, table scrolling and PDF export.

To adjust the overall appearance later, edit the CSS variables at the top of store-ui.css.
