import { NextResponse } from 'next/server';
import { Innertube } from 'youtubei.js';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const yt = await Innertube.create();
    
    // Search for artists specifically
    const results = await yt.music.search(query, { type: 'artist' });
    
    const artists = results.artists?.contents?.map((artist: any) => {
      // Get highest resolution thumbnail
      let thumb = artist.thumbnails?.[artist.thumbnails.length - 1]?.url || '';
      
      // Upscale thumbnail to high resolution if it's from google/youtube servers
      if (thumb) {
        thumb = thumb
          .replace(/=s\d+-[a-zA-Z0-9-]+/, '=s512-c')
          .replace(/=w\d+-h\d+-[a-zA-Z0-9-]+/, '=w512-h512-p-l90-rj')
          .replace(/\/s\d+\//, '/s512/')
          .replace(/w\d+-h\d+/, 'w512-h512');
      }

      return {
        id: artist.id,
        name: artist.name,
        thumbnail: thumb,
        subscribers: artist.subscribers || '',
      };
    }) || [];

    return NextResponse.json({ artists: artists.slice(0, 5) }); // Return top 5 matches
  } catch (err: any) {
    console.error('Error searching YouTube Music artists:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
