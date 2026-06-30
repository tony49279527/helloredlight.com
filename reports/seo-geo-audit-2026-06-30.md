# HelloRedLight SEO 与 GEO 第二轮审计

审计日期：2026-06-30
审计对象：`https://helloredlight.com` 对应 GitHub 仓库当前版本
方法：全量静态抓取、构建产物检查、链接与结构化数据校验、产品事实覆盖检查、GEO 查询集设计、有限本地性能诊断

## 执行摘要

本轮的核心不是继续堆关键词，而是把“可抓取、可引用、可核验、可转化”做成仓库级门禁。

- 全量扫描 60 个 HTML 文件；当前 sitemap 保留 50 个可索引 canonical URL。
- 12/12 个中英文产品页具备 SKU、MOQ、交期、运输、付款、保修、定制、包装、合规核验入口和询价 CTA。
- 6 个英文产品型号生成了真实 PDF 规格书；12/12 个双语产品页均可直接下载，技术资料覆盖率 100%。
- canonical、sitemap、内部链接、图片尺寸、H1、JSON-LD、hreflang 双向关系和孤儿页检查全部通过。
- 建立 60 条固定 GEO 查询基线和空白观察日志；没有伪造任何 AI 提及或引用。
- 首页无法核实的具名评价已撤下。旧案例页因缺少客户授权和证据暂设为 `noindex, follow`，并从 sitemap 移除。
- 产品 JSON-LD 和页面中无法证明的统一认证背书已移除，改为按 SKU 与目标市场核验。

当前实现就绪度为 **80/95**。另有 5 分“实际 AI 可见度”未测，不将“未测”伪装成零曝光。若按 100 分制保守记 0，则暂记 **80/100**。

## 评分矩阵

| 模块 | 权重 | 得分 | 说明 |
|---|---:|---:|---|
| 技术与索引控制 | 18 | 16 | 全量本地审计通过；仍缺 GSC/Bing 的真实覆盖与日志数据 |
| 页面与信息架构 | 14 | 13 | 无孤儿页；双语 hreflang 互指通过；5 个无证据案例 URL 已退出索引 |
| 内容与可提取事实 | 18 | 15 | 产品采购事实与 PDF 完整；组织级事实仍需原始证据 |
| 性能与体验 | 12 | 7 | 构建轻量；本地 Lighthouse 部分运行显示 SEO 100、性能约 85，但 CSSUsage 超时，不能当正式结果 |
| 实体与信任 | 12 | 7 | 去除无法核实背书并建立证据台账；公司规模、专利与认证仍待负责人交证 |
| 结构化数据 | 8 | 7 | JSON-LD 全部可解析；Product 与 Breadcrumb 覆盖良好；待部署后做官方富媒体测试 |
| GEO 可引用性 | 10 | 8 | robots、llms、事实块、FAQ、产品资料和固定查询集已就绪 |
| 实际 AI 可见度 | 5 | N/M | 未在六个平台完成可复现实测；观察日志保持空白 |
| 转化与商业目标 | 8 | 7 | 产品 CTA 全覆盖；主询盘表单必填项不超过 8 个 |

## 审计范围与抽样

本轮对仓库内全部 60 个 HTML 文件执行静态检查，不使用小样本代替全量抓取。sitemap 中 50 个 URL 必须同时满足：

1. 页面可索引且 canonical 唯一。
2. canonical 不含 `.html` 或非根路径尾斜杠。
3. sitemap URL 与页面 canonical 完全一致。
4. 本地链接目标存在。
5. 中英文 alternate 指向本地 canonical 且双向互指。

性能边界：

- Google PageSpeed API 在审计时返回 HTTP 429，未取得正式 PSI 数据。
- 本地 Lighthouse 诊断曾得到 Performance 约 85、SEO 100、FCP 约 1.3 秒、LCP 约 1.3 秒、CLS 0、TBT 约 515 毫秒。
- 该次运行出现 `CSS.enable` 超时，因此只作为排查方向，不作为正式验收或线上 Core Web Vitals 结论。

## 已完成问题

| ID | 原问题 | 处理 | 验收 |
|---|---|---|---|
| SEO-01 | 产品页技术资料几乎不可直接下载 | 生成 6 份型号级 PDF 并接入 12 个双语页面 | 覆盖率 100% |
| SEO-02 | 中文采购指南 hreflang 不互指 | 英文页补充 `zh-CN` alternate | 自动审计通过 |
| SEO-03 | 3 个索引页无站内入链 | 首页与中文资源中心补充上下文链接 | 孤儿页 0 |
| GEO-01 | 无固定查询集与观察格式 | 新增 60 条查询和证据日志 schema | 自动检查数量与落地页 |
| TRUST-01 | 首页存在无法证明的具名评价 | 改成采购核验路径 | 具名评价不再出现在索引页 |
| TRUST-02 | 旧案例以真实客户结果呈现但无证据 | `noindex, follow`、移出 sitemap、显示证据状态 | 5 个 URL 不再进入索引集 |
| TRUST-03 | 产品统一声明 FDA/CE 等认证 | 删除无编号的 `hasCertification` 与统一徽章 | 改为型号和市场级核验 |
| OPS-01 | 方法论无法持续执行 | 扩展 `npm run seo:audit` | 构建时自动失败 |

## 证据与实体审计

`data/claim-evidence-register.csv` 是组织事实与产品事实的统一台账。以下高风险主张仍为“负责人交证后才能升级信任分”的项目：

- 工厂面积、年产能、客户数、专利数与经营年限。
- ISO 13485 的持证主体、编号、范围、签发机构与有效期。
- FDA、EU、FCC、RoHS 文件与确切 SKU 的对应关系。
- 任何客户姓名、引语、销售结果、ROI、复购或故障率数据。

规则：没有原始证据或客户授权，不写入结构化数据，不作为首页背书，不进入 AI 可见度报告。

## Schema 审计

- 所有 JSON-LD 均能被 JSON 解析。
- 产品页保留 `Product`、SKU、品牌、制造商引用、已发布参数与报价信息。
- 产品 schema 不再统一附加无法核验的 `hasCertification`。
- 面包屑、组织、文章和 FAQ 标记继续保留。
- 下一步需在部署 URL 上运行 Google Rich Results Test 和 Schema.org Validator；本地解析通过不等于搜索引擎一定展示富媒体结果。

## GEO 查询与观察方案

固定基线位于 `data/geo-query-set.csv`，共 60 条：

- panel 12 条
- bed 10 条
- mask 10 条
- OEM 12 条
- portable 8 条
- brand / regional 8 条

覆盖 discovery、comparison、purchase、application、FAQ、compliance、logistics、brand 与 regional intent。实际测试必须写入 `data/geo-observation-log.csv`，至少记录引擎、模式、语言、查询 ID、是否提及、是否引用、引用 URL、位置、准确性和竞品。

## 剩余问题与路线图

### 0–7 天

1. 由 Operations、Quality、Regulatory、Legal、Sales 按证据台账补原始文件。
2. 部署本次版本后，提交 sitemap 到 Google Search Console 与 Bing Webmaster Tools。
3. 对首页、产品目录、6 个产品页、OEM 页运行移动端和桌面端 Lighthouse。
4. 检查线上 PDF 的 200 状态、`Content-Type: application/pdf` 和缓存头。

### 8–30 天

1. 每周在 ChatGPT、Google AI Overviews、Bing Copilot、Perplexity、Gemini、Claude 各跑一次固定查询集。
2. 每条核心产品族至少保留 10 条查询，并对重要查询做 3–5 个受控变体。
3. 根据真实引用结果修正落地页事实块；禁止为追求提及而虚构数据。
4. 用 GSC 查询数据补充零点击查询、品牌词与非品牌词分组。

### 31–90 天

1. 只有拿到客户授权和证据后，才将案例改为可索引的真实案例。
2. 为美国、欧盟、中东等市场建立有真实法规与物流差异的区域页，避免换地名式复制。
3. 将证书有效期、产品资料生成、hreflang、sitemap 和 GEO 周报接入 CI 或定时任务。

## 验收命令

```bash
python -m pip install -r requirements-specs.txt
npm run specs:generate
npm run validate
npm audit --audit-level=moderate
```

当前结果：生产构建通过，SEO/GEO 自动审计无阻断错误，依赖漏洞为 0。
