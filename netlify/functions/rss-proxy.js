// Netlify serverless function to fetch Substack RSS feed
exports.handler = async function(event, context) {
  const RSS_URL = 'https://www.forbidden-yoga.com/feed';

  try {
    const fetch = await import('node-fetch').then(mod => mod.default);
    const response = await fetch(RSS_URL);

    if (!response.ok) {
      throw new Error('Failed to fetch RSS feed');
    }

    const rssContent = await response.text();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      },
      body: rssContent
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch RSS feed' })
    };
  }
};
