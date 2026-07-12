import { NextResponse } from 'next/server';
import { Innertube } from 'youtubei.js';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const yt = await Innertube.create({ lang: 'en' });
    
    // Search for artists in YT Music
    const musicResults = await yt.music.search(query, { type: 'artist' });
    const musicArtists = musicResults.artists?.contents?.map((artist: any) => {
      let thumb = artist.thumbnails?.[artist.thumbnails.length - 1]?.url || '';
      if (thumb) {
        thumb = thumb.replace(/=s\d+-[a-zA-Z0-9-]+/, '=s512-c').replace(/=w\d+-h\d+-[a-zA-Z0-9-]+/, '=w512-h512-p-l90-rj').replace(/\/s\d+\//, '/s512/').replace(/w\d+-h\d+/, 'w512-h512');
      }
      return {
        id: artist.id,
        name: artist.name,
        thumbnail: thumb,
        subscribers: artist.subscribers || '',
      };
    }) || [];

    // Search for channels in regular YouTube
    const channelResults = await yt.search(query, { type: 'channel' });
    const regularChannels = channelResults.channels?.map((channel: any) => {
      let thumb = channel.author?.thumbnails?.[channel.author?.thumbnails.length - 1]?.url || '';
      if (thumb) {
        thumb = thumb.replace(/=s\d+-[a-zA-Z0-9-]+/, '=s512-c').replace(/=w\d+-h\d+-[a-zA-Z0-9-]+/, '=w512-h512-p-l90-rj').replace(/\/s\d+\//, '/s512/').replace(/w\d+-h\d+/, 'w512-h512');
      }
      return {
        id: channel.id || channel.author?.channel_id || channel.channel_id,
        name: channel.author?.name || channel.title?.toString(),
        thumbnail: thumb,
        subscribers: channel.subscribers?.toString() || channel.video_count?.toString() || '',
      };
    }) || [];

    return NextResponse.json({ 
      musicArtists: musicArtists.slice(0, 5),
      regularChannels: regularChannels.slice(0, 5)
    });
  } catch (err: any) {
    console.error('Error searching YouTube artists:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
