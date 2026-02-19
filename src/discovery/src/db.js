import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Sequelize, DataTypes } from 'sequelize';

// Load .env from project root (3 levels up from src/discovery/src/)
const __envDir = join(dirname(fileURLToPath(import.meta.url)), '../../..');
dotenv.config({ path: join(__envDir, '.env') });
dotenv.config({ path: join(__envDir, '.env.local'), override: true });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'osm',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
  }
);

// ── Packages ──────────────────────────────────────────────────────────────────
export const Package = sequelize.define('Package', {
  id:              { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:            { type: DataTypes.STRING(64), allowNull: false, unique: true },
  description:     { type: DataTypes.TEXT },
  latest_version:  { type: DataTypes.STRING(64) },
  downloads:       { type: DataTypes.INTEGER, defaultValue: 0 },
  github_url:      { type: DataTypes.STRING(512), allowNull: true },
  github_username: { type: DataTypes.STRING(128), allowNull: true },
  source:          { type: DataTypes.STRING(20), defaultValue: 'registry' },
  skillmd_sha:     { type: DataTypes.STRING(64),  allowNull: true },  // git blob SHA of SKILL.md — used to skip unchanged files on re-scan
}, { tableName: 'packages', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

// ── Package versions ───────────────────────────────────────────────────────────
export const PackageVersion = sequelize.define('PackageVersion', {
  id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  version:      { type: DataTypes.STRING(64), allowNull: false },
  manifest:     { type: DataTypes.TEXT('long'), allowNull: false },
  tarball_data: { type: DataTypes.BLOB('long'), allowNull: false },
  shasum:       { type: DataTypes.STRING(64), allowNull: false },
}, { tableName: 'package_versions', timestamps: true, createdAt: 'created_at', updatedAt: false });

PackageVersion.belongsTo(Package, { foreignKey: 'package_id' });
Package.hasMany(PackageVersion,   { foreignKey: 'package_id' });

// ── Discovered repos (crawl state) ────────────────────────────────────────────
// Tracks every GitHub repo the crawler has already analysed so we never
// re-process the same repo twice.
export const DiscoveredRepo = sequelize.define('DiscoveredRepo', {
  id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  repo_full_name: { type: DataTypes.STRING(512), allowNull: false, unique: true },
  stars:          { type: DataTypes.INTEGER, defaultValue: 0 },
  skills_found:   { type: DataTypes.INTEGER, defaultValue: 0 },
  analyzed_at:    { type: DataTypes.DATE, allowNull: false },
}, { tableName: 'discovered_repos', timestamps: false });

// ── Init ───────────────────────────────────────────────────────────────────────
export async function initDatabase() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  console.log('[db] Database ready');
}

export default sequelize;
