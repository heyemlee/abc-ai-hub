# ABC AI HUB — 部署文档

## 环境概览

本项目采用 **开发 / 生产** 双环境架构：

| 组件 | 开发环境 | 生产环境 |
|---|---|---|
| **Supabase** | `abc-ai-hub-dev` | `abc-ai-hub-prod` |
| **前端** | `localhost:3000` | Vercel (`your-domain.vercel.app`) |
| **Google OAuth** | 共用同一个 OAuth Client（多 Redirect URI） | ← 同左 |
| **数据库操作** | `prisma db push`（快速同步） | `prisma migrate deploy`（受控迁移） |

> [!IMPORTANT]
> 开发和生产必须使用 **不同的 Supabase 项目**，确保数据隔离、Schema 安全、API Keys 独立。

---

## 一、Supabase 配置

### 1.1 创建两个 Supabase 项目

1. 登录 [supabase.com](https://supabase.com) → **New Project**
2. 分别创建：
   - **开发项目**：命名为 `abc-ai-hub-dev`（或你现有的项目）
   - **生产项目**：命名为 `abc-ai-hub-prod`
3. Region 选择 `West US (North California)` 或 `East US (North Virginia)`
4. 设置 Database Password（⚠️ 务必保存，后面需要）

> [!WARNING]
> Supabase 免费计划最多 **2 个活跃项目**，开发 + 生产刚好用满。如需 staging 环境，需升级计划。

### 1.2 获取连接字符串（两个项目都需要）

进入每个项目的 **Settings → Database → Connection String**：

- **Transaction Pooler**（用于 `DATABASE_URL`）：
  ```
  postgresql://postgres.[REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
  ```
- **Direct Connection**（用于 `DIRECT_URL`）：
  ```
  postgresql://postgres.[REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
  ```

### 1.3 获取 API Keys（两个项目都需要）

进入每个项目的 **Settings → API**：

| 变量名 | 说明 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` secret key（⚠️ 不要暴露在前端） |

### 1.4 创建 Storage Bucket（两个项目都需要）

进入 Supabase Dashboard → **Storage**：

1. 点击 **New Bucket** → 命名为 `uploads`
2. 设置为 **Public** bucket（照片需要公开访问）
3. 添加 Policy：
   - `INSERT`：`authenticated` role
   - `SELECT`：`public`（或 `authenticated`）
   - `DELETE`：`authenticated` role

### 1.5 初始化数据库

#### 开发环境（本地）
```bash
cd web/

# .env 填写 dev 项目的连接字符串
npx prisma db push      # 快速同步 schema → 数据库
npx prisma generate      # 生成 Prisma Client
```

#### 生产环境（首次部署前）
```bash
cd web/

# 临时切换 .env 到 prod 项目的连接字符串（或使用环境变量覆盖）
DATABASE_URL="prod的连接字符串" DIRECT_URL="prod的直连字符串" npx prisma migrate deploy

# 或首次使用 db push 也可以：
DATABASE_URL="prod的连接字符串" DIRECT_URL="prod的直连字符串" npx prisma db push
```

> [!CAUTION]
> 操作完生产数据库后，**务必将 `.env` 切换回开发环境的连接字符串**，避免在开发时误操作生产数据。

---

## 二、Google OAuth 配置

### 2.1 创建 OAuth 凭据

1. 访问 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. **Create Credentials → OAuth 2.0 Client ID**
3. Application type: **Web application**
4. **Authorized redirect URIs**（添加两个）：
   - 开发环境：`http://localhost:3000/api/auth/callback/google`
   - 生产环境：`https://your-domain.vercel.app/api/auth/callback/google`
5. 保存 `Client ID` 和 `Client Secret`

> [!TIP]
> Google OAuth 开发和生产可以 **共用同一个 Client**，只需在 Redirect URIs 中同时添加两个地址即可。

### 2.2 生成 NextAuth Secret

```bash
openssl rand -base64 32
```

建议开发和生产使用 **不同的 Secret**，分别生成两个。

---

## 三、Vercel 前端部署

### 3.1 连接 GitHub

1. 推送代码到 GitHub
2. 登录 [vercel.com](https://vercel.com) → **Import Project**
3. 选择 GitHub 仓库
4. **Root Directory** 设置为 `web`
5. Framework Preset: **Next.js**

### 3.2 设置环境变量

在 Vercel Project → **Settings → Environment Variables** 中添加以下变量。

> ⚠️ 所有值均使用 **生产 (prod) Supabase 项目** 的信息：

| 变量名 | 值 | 说明 |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.[PROD-REF]:...` | Prod Supabase Transaction Pooler |
| `DIRECT_URL` | `postgresql://postgres.[PROD-REF]:...` | Prod Supabase Direct Connection |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | 生产域名 |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | 生产专用 Secret |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | 开发/生产共用 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | 开发/生产共用 |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://[PROD-REF].supabase.co` | Prod Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Prod Anon Key | Prod Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Prod Service Role Key | Prod Supabase |
| `RESEND_API_KEY` | Resend API Key | （可选）邮件通知 |
| `CRON_SECRET` | 自定义随机字符串 | Cron Job 认证 |

### 3.3 构建 & 部署

Vercel 会自动运行 `prisma generate` + `next build`。

确保 `package.json` 中有 postinstall 脚本：
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### 3.4 Cron Job 配置

`vercel.json` 已配置：每天 UTC 17:00（太平洋时间 9:00 AM）运行 `/api/cron/photo-reminder`。

在 Vercel Settings 中设置 `CRON_SECRET` 环境变量。Vercel 会自动添加 `Authorization: Bearer <CRON_SECRET>` header。

---

## 四、本地开发环境配置

### 4.1 `.env` 文件（本地开发用）

```bash
# ── Supabase Database（Dev 项目）──────────────────
DATABASE_URL="postgresql://postgres.[DEV-REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[DEV-REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres"

# ── NextAuth ───────────────────────────────────────
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-value"

# ── Google OAuth ───────────────────────────────────
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# ── Supabase Storage（Dev 项目）──────────────────
NEXT_PUBLIC_SUPABASE_URL="https://[DEV-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="dev-anon-key"
SUPABASE_SERVICE_ROLE_KEY="dev-service-role-key"

# ── Email (Resend) ────────────────────────────────
RESEND_API_KEY=""

# ── Vercel Cron Secret ─────────────────────────────
CRON_SECRET=""
```

> [!NOTE]
> `.env` 文件已在 `.gitignore` 中，不会被提交到 Git。每个开发者需自行配置。

---

## 五、部署后验证

### 5.1 首次登录

1. 访问 `https://your-domain.vercel.app/login`
2. 点击 "Sign in with Google"
3. 首次登录的用户会自动创建为 `USER` 角色

### 5.2 设置管理员

在 **生产** Supabase Dashboard → **Table Editor → User** 表中：

1. 找到你的用户记录
2. 将 `role` 从 `USER` 改为 `ADMIN`
3. 重新登录生效

### 5.3 功能测试清单

- [ ] Google 登录正常
- [ ] 提交日报
- [ ] 创建客户
- [ ] 上传客户照片
- [ ] 导出 Excel
- [ ] 知识库文件上传/删除
- [ ] 管理员可以切换用户角色
- [ ] Pipeline 视图展示客户
- [ ] Cron Job 正常触发（查看 Vercel Functions 日志）

---

## 六、Email 配置（可选）

如需启用 Photo Reminder 邮件通知：

1. 注册 [Resend](https://resend.com)
2. 获取 API Key
3. 添加到 Vercel 环境变量 `RESEND_API_KEY`
4. 在 Resend 中验证发送域名（或使用默认 `noreply@resend.dev`）

---

## 七、常见问题

### Q: 我能用同一个 Supabase 项目做开发和生产吗？

**强烈不建议。** 原因：
- 开发的 `prisma db push` 会直接改变数据库结构，可能破坏生产数据
- 测试数据会和真实用户数据混在一起
- 开发环境的频繁请求会消耗生产的 API 配额

### Q: 生产环境 schema 变更怎么操作？

推荐流程：
1. 本地修改 `schema.prisma`
2. 运行 `npx prisma migrate dev --name 描述` 生成 migration 文件
3. 提交代码并部署
4. Vercel 部署时会自动执行 `prisma migrate deploy`

如需手动执行：
```bash
DATABASE_URL="prod连接字符串" DIRECT_URL="prod直连字符串" npx prisma migrate deploy
```

### Q: 如何备份生产数据？

在 Supabase Dashboard → **Database → Backups** 可以查看自动备份。免费计划提供每日备份，保留 7 天。
