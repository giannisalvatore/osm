import db from '../db/database.js';

export const skillsController = {
  // GET /skills - Lista tutte le skill
  async listSkills(ctx) {
    try {
      const skills = db.prepare('SELECT * FROM skills ORDER BY created_at DESC').all();
      
      ctx.body = {
        success: true,
        count: skills.length,
        skills: skills.map(skill => ({
          ...skill,
          permissions: JSON.parse(skill.permissions || '[]'),
          dependencies: JSON.parse(skill.dependencies || '{}'),
          ai_verified: Boolean(skill.ai_verified)
        }))
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { success: false, error: error.message };
    }
  },

  // GET /skills/:name - Dettagli skill specifica
  async getSkill(ctx) {
    try {
      const { name } = ctx.params;
      const skill = db.prepare('SELECT * FROM skills WHERE name = ?').get(name);
      
      if (!skill) {
        ctx.status = 404;
        ctx.body = { success: false, error: 'Skill not found' };
        return;
      }

      ctx.body = {
        success: true,
        skill: {
          ...skill,
          permissions: JSON.parse(skill.permissions || '[]'),
          dependencies: JSON.parse(skill.dependencies || '{}'),
          ai_verified: Boolean(skill.ai_verified)
        }
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { success: false, error: error.message };
    }
  },

  // GET /skills/search/:query - Cerca skill
  async searchSkills(ctx) {
    try {
      const { query } = ctx.params;
      const skills = db.prepare(`
        SELECT * FROM skills 
        WHERE name LIKE ? OR description LIKE ? OR category LIKE ?
        ORDER BY downloads DESC
      `).all(`%${query}%`, `%${query}%`, `%${query}%`);

      ctx.body = {
        success: true,
        count: skills.length,
        query,
        skills: skills.map(skill => ({
          ...skill,
          permissions: JSON.parse(skill.permissions || '[]'),
          dependencies: JSON.parse(skill.dependencies || '{}'),
          ai_verified: Boolean(skill.ai_verified)
        }))
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { success: false, error: error.message };
    }
  },

  // POST /skills - Pubblica nuova skill
  async createSkill(ctx) {
    try {
      const { name, version, description, author, repository, ai_verified, permissions, entrypoint, dependencies, category } = ctx.request.body;

      if (!name || !version || !description) {
        ctx.status = 400;
        ctx.body = { success: false, error: 'Missing required fields: name, version, description' };
        return;
      }

      const stmt = db.prepare(`
        INSERT INTO skills (name, version, description, author, repository, ai_verified, permissions, entrypoint, dependencies, category)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        name,
        version,
        description,
        author || 'Unknown',
        repository || '',
        ai_verified ? 1 : 0,
        JSON.stringify(permissions || []),
        entrypoint || 'index.js',
        JSON.stringify(dependencies || {}),
        category || 'other'
      );

      ctx.status = 201;
      ctx.body = {
        success: true,
        message: 'Skill created successfully',
        skillId: result.lastInsertRowid
      };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { success: false, error: error.message };
    }
  },

  // PUT /skills/:name - Aggiorna skill
  async updateSkill(ctx) {
    try {
      const { name } = ctx.params;
      const updates = ctx.request.body;

      const skill = db.prepare('SELECT * FROM skills WHERE name = ?').get(name);
      if (!skill) {
        ctx.status = 404;
        ctx.body = { success: false, error: 'Skill not found' };
        return;
      }

      const fields = [];
      const values = [];

      if (updates.version) { fields.push('version = ?'); values.push(updates.version); }
      if (updates.description) { fields.push('description = ?'); values.push(updates.description); }
      if (updates.repository) { fields.push('repository = ?'); values.push(updates.repository); }
      if (updates.permissions) { fields.push('permissions = ?'); values.push(JSON.stringify(updates.permissions)); }
      if (updates.dependencies) { fields.push('dependencies = ?'); values.push(JSON.stringify(updates.dependencies)); }
      
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(name);

      const stmt = db.prepare(`UPDATE skills SET ${fields.join(', ')} WHERE name = ?`);
      stmt.run(...values);

      ctx.body = { success: true, message: 'Skill updated successfully' };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { success: false, error: error.message };
    }
  },

  // Incrementa downloads counter
  async incrementDownloads(ctx) {
    try {
      const { name } = ctx.params;
      db.prepare('UPDATE skills SET downloads = downloads + 1 WHERE name = ?').run(name);
      ctx.body = { success: true };
    } catch (error) {
      ctx.status = 500;
      ctx.body = { success: false, error: error.message };
    }
  }
};
