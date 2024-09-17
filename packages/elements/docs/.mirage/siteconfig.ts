
import { ContainerLoader, ContainerModule } from '@roenlie/mirage-docs/app/aegis.js'

const siteConfig = {
   "env": {
      "rootDir": "docs",
      "entryDir": "./docs/pages",
      "libDir": ".mirage",
      "base": ""
   },
   "root": {
      "darkTheme": [],
      "lightTheme": [],
      "styleImports": [],
      "scriptImports": [],
      "layout": {
         "headingText": "Mimic Elements",
         "logoHeight": "",
         "logoSrc": "logo.svg",
         "clearLogOnReload": true
      },
      "sidebar": {
         "delimiter": "_",
         "nameReplacements": [
            [
               ".docs",
               ""
            ],
            [
               ".editor",
               " Editor"
            ],
            [
               "-",
               " "
            ]
         ]
      },
      "styleOverrides": {
         "layout": "",
         "sidebar": "\n\t\t\t\t\t\t.greeting .title {\n\t\t\t\t\t\t\twidth: min-content;\n\t\t\t\t\t\t}\n\t\t\t\t\t\t",
         "metadata": "",
         "pathTree": "",
         "cmpEditor": "",
         "sourceEditor": "",
         "pageHeader": "",
         "pageTemplate": ""
      }
   },
   "pages": {
      "darkTheme": [],
      "lightTheme": [],
      "styles": [],
      "scripts": [
         {
            "src": "/bootstrap.ts"
         }
      ]
   }
};
const routes = [
   "/action-bar/action-bar",
   "/alert/alert",
   "/button/button",
   "/dialog/dialog",
   "/fragment-table/fragment-table",
   "/input/input",
   "/nav-rail/nav-rail",
   "/progress-bar/progress-bar",
   "/ripple/ripple",
   "/spinner/spinner",
   "/tabs/tabs",
   "/template-list/template-list",
   "/text/text",
   "/typeahead/typeahead",
   "/upload/upload"
];

ContainerLoader.load(new ContainerModule(({bind}) => {
	bind('site-config').toConstantValue(siteConfig);
	bind('routes').toConstantValue(routes);
}));
