import { Router } from 'express';
import { validateZod } from '../middleware/validateZod';
import { z } from 'zod';
import contentScraperService from '../services/contentScraperService';

const router = Router();

// Schema for scraping request
const scrapeRequestSchema = z.object({
  url: z.string().url('Invalid URL provided'),
});

/**
 * POST /api/content/scrape
 * Scrape content from a website URL
 */
router.post('/scrape', validateZod(scrapeRequestSchema), async (req, res, next) => {
  try {
    const { url } = req.body;

    const scrapedContent = await contentScraperService.scrapeWebsite(url);

    res.json({
      success: true,
      data: scrapedContent,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
