import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const getHtmlFiles = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'dist' && file !== 'node_modules' && file !== 'scripts' && file !== 'src' && file !== 'public' && !file.startsWith('.')) {
        getHtmlFiles(filePath, fileList);
      }
    } else if (file.endsWith('.html')) {
        fileList.push(filePath);
    }
  }
  return fileList;
};

const htmlFiles = getHtmlFiles(rootDir);

console.log(`Found ${htmlFiles.length} HTML files. Injecting SEO...`);

// Social OG Tags Snippet
const generateOgTags = (title, desc) => `
    <!-- Open Graph / Social -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://helloredlight.com/" />
    <meta property="og:title" content="${title.replace(/"/g, '&quot;')}" />
    <meta property="og:description" content="${desc.replace(/"/g, '&quot;')}" />
    <meta property="og:image" content="https://helloredlight.com/images/og-cover.jpg" />
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:title" content="${title.replace(/"/g, '&quot;')}" />
    <meta property="twitter:description" content="${desc.replace(/"/g, '&quot;')}" />
    <meta property="twitter:image" content="https://helloredlight.com/images/og-cover.jpg" />
`;

htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Extract Title & Description
  const titleMatch = content.match(/<title>(.*?)<\/title>/);
  const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
  
  if (titleMatch && descMatch) {
    const title = titleMatch[1];
    const desc = descMatch[1];
    
    // Check if OG tags already exist
    if (!content.includes('property="og:title"')) {
      const ogTags = generateOgTags(title, desc);
      // Inject before </head>
      content = content.replace('</head>', ogTags + '\n</head>');
    }
    
    // Check if Favicon exists
    if (!content.includes('rel="icon"')) {
      const faviconTag = '\n    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />';
      content = content.replace('</head>', faviconTag + '\n</head>');
    }
  }

  // Update Organization Schema in index.html & zh/index.html to add LinkedIn
  if (file.endsWith('index.html')) {
      if (content.includes('"@type": "Organization"')) {
          if (!content.includes('"sameAs":')) {
              // Add identical SameAs array to JSON
               content = content.replace(
                  /"contactPoint": {([\s\S]*?)}/,
                  `"contactPoint": {$1},
      "sameAs": [
        "https://www.linkedin.com/company/helloredlight/"
      ]`
               );
          }
      }
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Processed: ${path.relative(rootDir, file)}`);
});

console.log('SEO Injection Completed.');
