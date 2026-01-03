/**
 * Quick script to list available Feather Icons (fi) from react-icons
 * Run: node list-icons.js
 */

// This script requires react-icons to be installed
try {
  const reactIcons = require('react-icons/fi');
  
  console.log('\n📦 Available Feather Icons (react-icons/fi)\n');
  console.log('=' .repeat(60));
  
  const iconNames = Object.keys(reactIcons)
    .filter(name => name.startsWith('Fi'))
    .sort();
  
  console.log(`\nTotal Icons: ${iconNames.length}\n`);
  
  // Group by category for easier browsing
  const categories = {
    'Navigation': iconNames.filter(n => /Home|Menu|Arrow|Chevron|Navigation/.test(n)),
    'Users & People': iconNames.filter(n => /User|People|Person/.test(n)),
    'Business & Finance': iconNames.filter(n => /Dollar|Credit|Trending|Chart|Money|Cash/.test(n)),
    'Communication': iconNames.filter(n => /Mail|Message|Phone|Video|Radio|Rss|Share/.test(n)),
    'Files & Documents': iconNames.filter(n => /File|Folder|Download|Upload|Save|Document/.test(n)),
    'Actions': iconNames.filter(n => /Plus|Minus|Edit|Trash|Check|X|Refresh|Search|Rotate/.test(n)),
    'System & Settings': iconNames.filter(n => /Settings|Sliders|Shield|Lock|Key|Cog/.test(n)),
    'Workflow & Flow': iconNames.filter(n => /Git|Activity|Zap|Target|Branch|Merge/.test(n)),
    'Resources': iconNames.filter(n => /Briefcase|Layers|Grid|Package|Box|Archive/.test(n)),
    'Network': iconNames.filter(n => /Link|Wifi|Network|Connection|Globe/.test(n)),
    'Other': iconNames.filter(n => 
      !/Home|Menu|Arrow|Chevron|User|People|Person|Dollar|Credit|Trending|Chart|Money|Cash|Mail|Message|Phone|Video|Radio|Rss|Share|File|Folder|Download|Upload|Save|Document|Plus|Minus|Edit|Trash|Check|X|Refresh|Search|Rotate|Settings|Sliders|Shield|Lock|Key|Cog|Git|Activity|Zap|Target|Branch|Merge|Briefcase|Layers|Grid|Package|Box|Archive|Link|Wifi|Network|Connection|Globe/.test(n)
    )
  };
  
  Object.entries(categories).forEach(([category, icons]) => {
    if (icons.length > 0) {
      console.log(`\n${category}:`);
      console.log(icons.map(name => `  - ${name}`).join('\n'));
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('\n💡 Usage:');
  console.log('  import { FiHome, FiUsers } from \'react-icons/fi\';');
  console.log('\n🌐 Browse all icons: https://react-icons.github.io/react-icons/#/icons/fi\n');
  
} catch (error) {
  console.error('❌ Error: react-icons not found or not installed');
  console.error('   Run: npm install react-icons');
  console.error('\n   Or browse online: https://react-icons.github.io/react-icons/#/icons/fi\n');
}




