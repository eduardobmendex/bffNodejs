import { createServer } from 'http';
import fetch from 'node-fetch';
 
const port = 5000;
const YOUTUBE_API_KEY = 'AIzaSyAk1fB94rQlp5Dekje_J8boVtGguoLpKlw';

async function getYoutubeResults(query, resultsPerPage, pageToken)
 {
  let url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&type=video&part=snippet&q=${query}`;
  if (resultsPerPage) 
    {
    url = `${url}&maxResults=${resultsPerPage}`;
  }
  if (pageToken)
     {
    url = `${url}&pageToken=${pageToken}`;
  }

  try
   {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) 
      {
      console.error(`YouTube API error: ${data.error.message}`);
      throw new Error(`YouTube API error: ${data.error.message}`);
    }

    return data;
  } catch (error) 
  {
    console.error(`Erro: ${error.message}`);
    throw error;
  }
}

async function fetchAllYoutubeResults(query, maxResults) 
{
  const videoData = [];
  let totalResults = 0;
  let nextPageToken = undefined;
  const resultsPerPage = 18; 

  while (totalResults < maxResults) 
    {
    const remainingResults = maxResults - totalResults;
    const currentResultsPerPage = Math.min(resultsPerPage, remainingResults);
    const data = await getYoutubeResults(query, currentResultsPerPage, nextPageToken);

    if (!data.items || data.items.length === 0) 
      {
      console.error('No items in data:', data);
      break;
    }

    videoData.push(...data.items);
    totalResults += data.items.length;
    nextPageToken = data.nextPageToken;

    if (!nextPageToken)
       {
      break; 
    }
  }

  return videoData.map(item => ({
    title: item.snippet.title,
    description: item.snippet.description,
    videoUrl: `https://www.youtube.com/embed/${item.id.videoId}`,
    thumbnailUrl: item.snippet.thumbnails.default.url  
  }));
}

const server = createServer(async (req, res) =>
   {
 
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);

  if (req.url.startsWith('/videos'))
     {
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const query = urlParams.get('q');
    const maxResults = parseInt(urlParams.get('maxResults'), 12) || 12;  

    try
     {
      const videoData = await fetchAllYoutubeResults(query, maxResults);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(videoData, null, 2));
    } catch (error) 
    {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: error.message }));
    }
  } else
   {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Route not found');
  }
});

server.listen(port, () => 
  {
  console.log(`Server listening on port ${port}`);
});
