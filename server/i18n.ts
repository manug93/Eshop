import { Express } from "express";
import { storage } from "./storage";
import { InsertTranslation } from "@shared/schema";

export function setupI18n(app: Express) {
  // Get translations for an entity
  app.get("/api/translations/:entityType/:entityId/:language", async (req, res, next) => {
    try {
      const { entityType, entityId, language } = req.params;
      const translations = await storage.getTranslations(
        entityType, 
        parseInt(entityId), 
        language
      );
      res.json(translations);
    } catch (error) {
      next(error);
    }
  });

  // Create or update a translation
  app.post("/api/translations", async (req, res, next) => {
    try {
      // Check admin permission
      if (!req.isAuthenticated() || !(req.user as any).isAdmin) {
        return res.status(403).json({ message: "Permission denied" });
      }

      const translationData: InsertTranslation = req.body;
      
      // Validate data
      if (!translationData.entityType || 
          !translationData.entityId || 
          !translationData.language || 
          !translationData.field || 
          !translationData.value) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const translation = await storage.createTranslation(translationData);
      res.status(201).json(translation);
    } catch (error) {
      next(error);
    }
  });

  // Create or update multiple translations
  app.post("/api/translations/bulk", async (req, res, next) => {
    try {
      // Check admin permission
      if (!req.isAuthenticated() || !(req.user as any).isAdmin) {
        return res.status(403).json({ message: "Permission denied" });
      }

      const translations: InsertTranslation[] = req.body;
      
      if (!Array.isArray(translations) || translations.length === 0) {
        return res.status(400).json({ message: "Invalid data format" });
      }

      const results = await Promise.all(
        translations.map(translation => storage.createTranslation(translation))
      );

      res.status(201).json(results);
    } catch (error) {
      next(error);
    }
  });

  // Set user preferred language
  app.post("/api/user/language", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { language } = req.body;
      
      if (!language || typeof language !== 'string') {
        return res.status(400).json({ message: "Invalid language" });
      }

      // Supported languages
      const supportedLanguages = ['en', 'fr']; // English, French
      
      if (!supportedLanguages.includes(language)) {
        return res.status(400).json({ 
          message: "Unsupported language", 
          supportedLanguages 
        });
      }

      const user = await storage.updateUser((req.user as any).id, {
        preferredLanguage: language
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  // Get available languages
  app.get("/api/languages", (req, res) => {
    const languages = [
      { code: 'en', name: 'English' },
      { code: 'fr', name: 'Français' }
    ];
    
    res.json(languages);
  });
}