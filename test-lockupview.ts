import { Innertube } from 'youtubei.js';
import * as util from 'util';

async function test() {
  const yt = await Innertube.create({ lang: 'en' });
  const channel = await yt.getChannel('UCiZXqxS2Bg7zRlXeOViIaIg');
  const playlistsTab = await channel.getPlaylists();
  
  if (playlistsTab.playlists && playlistsTab.playlists.length > 0) {
    const pl = playlistsTab.playlists[0];
    console.log("Full properties of LockupView:");
    console.log(util.inspect(pl, { depth: null, colors: true }));
  }
}

test().catch(console.error);
