import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Sequelize, DataTypes } from 'sequelize';
const __envDir = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
dotenv.config({ path: join(__envDir, '.env') });
dotenv.config({ path: join(__envDir, '.env.local'), override: true });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'osm',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: false,
  }
);

export const User = sequelize.define('User', {
  id:                 { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username:           { type: DataTypes.STRING(64), allowNull: false, unique: true },
  email:              { type: DataTypes.STRING(255) },
  password:           { type: DataTypes.STRING(255) },
  verified:           { type: DataTypes.BOOLEAN, defaultValue: false },
  verification_token: { type: DataTypes.STRING(64), allowNull: true },
}, { tableName: 'users', timestamps: true, createdAt: 'created_at', updatedAt: false });

export const AuthToken = sequelize.define('AuthToken', {
  id:    { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  token: { type: DataTypes.STRING(255), allowNull: false, unique: true },
}, { tableName: 'auth_tokens', timestamps: true, createdAt: 'created_at', updatedAt: false });

AuthToken.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(AuthToken,   { foreignKey: 'user_id' });

export const Package = sequelize.define('Package', {
  id:              { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:            { type: DataTypes.STRING(64), allowNull: false, unique: true },
  description:     { type: DataTypes.TEXT },
  latest_version:  { type: DataTypes.STRING(64) },
  downloads:       { type: DataTypes.INTEGER, defaultValue: 0 },
  github_url:      { type: DataTypes.STRING(512), allowNull: true },
  github_username: { type: DataTypes.STRING(128), allowNull: true },
  source:          { type: DataTypes.STRING(20), defaultValue: 'registry' },
  skillmd_sha:     { type: DataTypes.STRING(64),  allowNull: true },
}, { tableName: 'packages', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

export const PackageVersion = sequelize.define('PackageVersion', {
  id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  version:      { type: DataTypes.STRING(64), allowNull: false },
  manifest:     { type: DataTypes.TEXT('long'), allowNull: false },
  tarball_data: { type: DataTypes.BLOB('long'), allowNull: false },
  shasum:       { type: DataTypes.STRING(64), allowNull: false },
}, { tableName: 'package_versions', timestamps: true, createdAt: 'created_at', updatedAt: false });

PackageVersion.belongsTo(Package, { foreignKey: 'package_id' });
Package.hasMany(PackageVersion,   { foreignKey: 'package_id', as: 'versions' });

export const PackageOwner = sequelize.define('PackageOwner', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
}, { tableName: 'package_owners', timestamps: true, createdAt: 'created_at', updatedAt: false });

PackageOwner.belongsTo(Package, { foreignKey: 'package_id' });
PackageOwner.belongsTo(User,    { foreignKey: 'user_id' });
Package.hasMany(PackageOwner,   { foreignKey: 'package_id', as: 'owners' });

export async function initDatabase() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  console.log('Database initialized successfully');
}

export default sequelize;
