import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectSlug = 'couchers' } = req.query;
    const weblateApiUrl = process.env.NEXT_PUBLIC_WEBLATE_API_URL || 'https://translate.couchershq.org/api';
    const url = `${weblateApiUrl}/projects/${projectSlug}/languages/`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `Weblate API error: ${response.status} ${response.statusText}` 
      });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching Weblate stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
