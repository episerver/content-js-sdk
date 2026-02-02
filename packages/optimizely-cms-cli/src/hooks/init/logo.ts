import { Hook } from '@oclif/core';

const hook: Hook<'init'> = async function (opts) {
  // Only show logo for help command or when --help flag is used
  const showHelp = opts.id === 'help' ||
                   process.argv.includes('--help') ||
                   process.argv.includes('-h') ||
                   process.argv.length === 2; // No args provided

  if (showHelp) {
    console.log('');
    console.log('   ██████╗ ██████╗ ████████╗██╗███╗   ███╗██╗███████╗███████╗██╗   ██╗   ██╗');
    console.log('  ██╔═══██╗██╔══██╗╚══██╔══╝██║████╗ ████║██║╚══███╔╝██╔════╝██║   ╚██╗ ██╔╝');
    console.log('  ██║   ██║██████╔╝   ██║   ██║██╔████╔██║██║  ███╔╝ █████╗  ██║    ╚████╔╝ ');
    console.log('  ██║   ██║██╔═══╝    ██║   ██║██║╚██╔╝██║██║ ███╔╝  ██╔══╝  ██║     ╚██╔╝  ');
    console.log('  ╚██████╔╝██║        ██║   ██║██║ ╚═╝ ██║██║███████╗███████╗███████╗██╔╝   ');
    console.log('   ╚═════╝ ╚═╝        ╚═╝   ╚═╝╚═╝     ╚═╝╚═╝╚══════╝╚══════╝╚══════╝╚═╝    ');
    console.log('');
    console.log('                         CMS CLI');
    console.log('                 Code-first content modeling\n');
  }
};

export default hook;
