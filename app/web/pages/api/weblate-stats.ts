import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch(
      "https://cdn.couchers.org/api/projects/couchers/languages/",
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Weblate API error: ${response.status} ${response.statusText}`,
      });
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching Weblate stats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
