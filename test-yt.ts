import { Innertube } from 'youtubei.js';

async function main() {
  const yt = await Innertube.create();
  const artist = await yt.music.getArtist('UCq3Ci-h945sbEYXpVlw7rJg'); // The Chainsmokers or someone
  console.log('Top Songs:', artist.sections[0]);
  console.log('Albums section:', artist.sections[1]);
}
main().catch(console.error);
