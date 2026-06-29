import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'חסר קישור לפלייליסט' }, { status: 400 });
    }

    // Extract playlist ID from URL
    let playlistId = '';
    try {
      const parsedUrl = new URL(url);
      playlistId = parsedUrl.searchParams.get('list') || '';
    } catch (e) {
      return NextResponse.json({ error: 'קישור לא תקין' }, { status: 400 });
    }

    if (!playlistId) {
      return NextResponse.json({ error: 'לא נמצא מזהה פלייליסט בקישור' }, { status: 400 });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'מפתח API של יוטיוב חסר בשרת' }, { status: 500 });
    }

    // Fetch playlist details (title, description)
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`
    );
    const playlistData = await playlistResponse.json();

    if (!playlistData.items || playlistData.items.length === 0) {
      return NextResponse.json({ error: 'הפלייליסט לא נמצא או שהוא פרטי' }, { status: 404 });
    }

    const playlistSnippet = playlistData.items[0].snippet;

    // Fetch playlist items (videos)
    // For simplicity, fetching up to 50 items (max per page)
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}`
    );
    const videosData = await videosResponse.json();

    if (!videosData.items || videosData.items.length === 0) {
      return NextResponse.json({ error: 'לא נמצאו סרטונים בפלייליסט' }, { status: 404 });
    }

    const validItems = videosData.items.filter((item: any) => item.snippet.title !== 'Private video' && item.snippet.title !== 'Deleted video');

    const videoIds = validItems.map((item: any) => item.contentDetails.videoId).join(',');
    
    let statsMap: Record<string, number> = {};
    if (videoIds) {
      const videoStatsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`
      );
      const videoStatsData = await videoStatsResponse.json();
      
      if (videoStatsData.items) {
        videoStatsData.items.forEach((v: any) => {
          statsMap[v.id] = parseInt(v.statistics?.viewCount || '0', 10);
        });
      }
    }

    const videos = validItems.map((item: any, index: number) => {
        const videoId = item.contentDetails.videoId;
        // Find best thumbnail
        const thumbnails = item.snippet.thumbnails || {};
        const thumbnail = thumbnails.maxres?.url || thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || 'https://picsum.photos/seed/placeholder/640/360';
        
        return {
          youtube_id: videoId,
          title: item.snippet.title,
          thumbnail: thumbnail,
          position: index + 1,
          publishedAt: item.contentDetails.videoPublishedAt || item.snippet.publishedAt || new Date().toISOString(),
          viewCount: statsMap[videoId] || 0
        };
      });

    return NextResponse.json({
      title: playlistSnippet.title,
      description: playlistSnippet.description,
      videos
    });
  } catch (error) {
    console.error('YouTube API error:', error);
    return NextResponse.json({ error: 'שגיאה בעת הבאת הנתונים מיוטיוב' }, { status: 500 });
  }
}
