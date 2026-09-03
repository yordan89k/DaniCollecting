const fs = require('fs');
let content = fs.readFileSync('src/components/MainMenu.tsx', 'utf8');

content = content.replace(
  /<Waves size=\{60\} className="animate-bounce drop-shadow-md" style=\{\{ animationDelay: '0.4s' \}\} \/>/,
  `<Waves size={60} className="animate-bounce drop-shadow-md" style={{ animationDelay: '0.4s' }} />\n        <Trees size={60} className="animate-bounce drop-shadow-md" style={{ animationDelay: '0.6s' }} />`
);

content = content.replace(
  /<div className="flex gap-4 md:gap-6 mt-4">/,
  `<div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-4">`
);

content = content.replace(
  /<span>Ocean<\/span>\s*<\/button>/,
  `<span>Ocean</span>\n        </button>\n        <button \n          onClick={(e) => { e.stopPropagation(); handleStart(4); }}\n          className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xl md:text-2xl py-3 px-6 rounded-full shadow-lg border-4 border-amber-800 transform transition hover:scale-110 active:scale-95 flex flex-col items-center"\n        >\n          <span>Level 4</span>\n          <span className="text-sm opacity-80">Jungle</span>\n        </button>`
);

fs.writeFileSync('src/components/MainMenu.tsx', content);
console.log('Fixed menu');
