# ABC AI HUB — 部署文档

？## 一、Supabase 后端部署

### 1.1 创建 Supabase 项目
1. 登录 [supabase.com](https://supabase.com) → **New Project**
2. 选择 Region（建议 `West US` 或 `East US`）
3. 设置 Database Password（保存！后面需要）
4. 等待项目初始化完成

### 1.2 获取连接字符串
进入 **Settings → Database → Connection String**：
- **Transaction Pooler**（用于 `DATABASE_URL`）：
  ```
  postgresql://postgres.[REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
  ```
- **Direct Connection**（用于 `DIRECT_URL`）：
  ```
  postgresql://postgres.[REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
  ```

### 1.3 初始化数据库（本地执行）
```bash
# 在 web/ 目录下
cp .env.example .env
# 填写 .env 中的 DATABASE_URL 和 DIRECT_URL

npx prisma db push    # 创建所有表
npx prisma generate   # 生成客户端
```

### 1.4 创建 Storage Bucket
进入 Supabase Dashboard → **Storage**：
1. 点击 **New Bucket** → 命名为 `uploads`
2. 设置为 **Public** bucket（照片需要公开访问）
3. 添加 Policy：Allow authenticated uploads
   - `INSERT`：`authenticated` role
   - `SELECT`：`public`（或 `authenticated`）
   - `DELETE`：`authenticated` role

### 1.5 获取 API Keys
进入 **Settings → API**：
- `NEXT_PUBLIC_SUPABASE_URL` = Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `anon` key
- `SUPABASE_SERVICE_ROLE_KEY` = `service_role` key（⚠️ 不要暴露在前端）

---

## 二、Google OAuth 配置

### 2.1 创建 OAuth 凭据
1. 访问 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. **Create Credentials → OAuth 2.0 Client ID**
3. Application type: **Web application**
4. **Authorized redirect URIs**:
   - 开发环境：`http://localhost:3000/api/auth/callback/google`
   - 生产环境：`https://your-domain.vercel.app/api/auth/callback/google`
5. 保存 `Client ID` 和 `Client Secret`

### 2.2 生成 NextAuth Secret
```bash
openssl rand -base64 32
```
将结果填入 `NEXTAUTH_SECRET`

---

## 三、Vercel 前端部署

### 3.1 连接 GitHub
1. 推送代码到 GitHub
2. 登录 [vercel.com](https://vercel.com) → **Import Project**
3. 选择 GitHub 仓库
4. **Root Directory** 设置为 `web`
5. Framework Preset: **Next.js**

### 3.2 设置环境变量
在 Vercel Project → **Settings → Environment Variables** 中添加：

| 变量名 | 值 |
|---|---|
| `DATABASE_URL` | Supabase Transaction Pooler URL |
| `DIRECT_URL` | Supabase Direct Connection URL |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` 生成的值 |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key |
| `RESEND_API_KEY` | (可选) Resend API Key |
| `CRON_SECRET` | 自定义随机字符串，用于 cron job 认证 |

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

## 四、部署后验证

### 4.1 首次登录
1. 访问 `https://your-domain.vercel.app/login`
2. 点击 "Sign in with Google"
3. 首次登录的用户会自动创建为 `USER` 角色

### 4.2 设置管理员
在 Supabase Dashboard → **Table Editor → User** 表中：
1. 找到你的用户记录
2. 将 `role` 从 `USER` 改为 `ADMIN`
3. 重新登录生效

### 4.3 功能测试清单
- [ ] Google 登录正常
- [ ] 提交日报
- [ ] 创建客户
- [ ] 上传客户照片
- [ ] 导出 Excel
- [ ] 知识库文件上传/删除
- [ ] 管理员可以切换用户角色
- [ ] Pipeline 视图展示客户

---

## 五、Email 配置（可选）

如需启用 Photo Reminder 邮件通知：
1. 注册 [Resend](https://resend.com)
2. 获取 API Key
3. 添加到 Vercel 环境变量 `RESEND_API_KEY`
4. 在 Resend 中验证发送域名（或使用默认 `noreply@resend.dev`）
