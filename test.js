const process = require('node:process');
const translateUsingGoogle = require('./index.js');

async function main() {
    const original_text = 'Hello world, this translation is going from English to Dutch.';

    const translated_text = await translateUsingGoogle(original_text, { from: 'auto', to: 'nl' }, 'translate.google.com');

    console.log('Original text:', original_text);
    console.log('Translated text:', translated_text);
}

main().catch((error) => {
    console.trace(error);

    process.exit(1);
});
