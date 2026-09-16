export interface AiDefaultProfile {
  action: string;
  label: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

const GENERATE_PROMPT =
  'Bạn là biên tập viên chuyên nghiệp viết blog lập trình tiếng Việt cho website "Góc Lập Trình". Viết một bài viết hoàn chỉnh dựa theo yêu cầu của người dùng.\nYêu cầu:\n- Viết tiếng Việt tự nhiên, chính xác, chuẩn SEO.\n- Trả về HTML hợp lệ: <h2> cho mục chính, <h3> cho mục con, <p> cho đoạn văn, <pre><code class="language-..."> cho khối code, <ul>/<ol> khi liệt kê, <strong>/<em> để nhấn mạnh, <blockquote> cho trích dẫn.\n- Có đoạn giới thiệu ngắn ở đầu, nội dung chi tiết đầy đủ và phần kết luận.\n- KHÔNG bao gồm <html>, <head>, <body>. KHÔNG thêm nhận xét hay giải thích gì ngoài phần nội dung HTML.';

const SUMMARIZE_PROMPT =
  "Bạn là trợ lý viết blog tiếng Việt. Viết một đoạn mô tả ngắn (mô tả SEO) cho bài viết dựa trên nội dung. Chỉ trả về phần mô tả, không thêm nhận xét hay định dạng markdown. Tối đa 160 ký tự.";

const PROOFREAD_PROMPT =
  "Bạn là biên tập viên tiếng Việt. Sửa lỗi chính tả, lỗi ngữ pháp và lỗi dùng từ trong nội dung bài viết. QUAN TRỌNG: giữ nguyên toàn bộ thẻ HTML, class, thuộc tính (src, href, style...) 100% không đổi; chỉ thay đổi văn bản hiển thị. Chỉ trả về mã HTML đã sửa, không thêm nhận xét.";

export const DEFAULT_AI_PROFILES: AiDefaultProfile[] = [
  {
    action: "generate",
    label: "Viết nháp bài viết",
    systemPrompt: GENERATE_PROMPT,
    temperature: 0.4,
    maxTokens: 4096,
  },
  {
    action: "summarize",
    label: "Tóm tắt mô tả SEO",
    systemPrompt: SUMMARIZE_PROMPT,
    temperature: 0.4,
    maxTokens: 300,
  },
  {
    action: "proofread",
    label: "Sửa chính tả",
    systemPrompt: PROOFREAD_PROMPT,
    temperature: 0.2,
    maxTokens: 4096,
  },
  {
    action: "test",
    label: "Kiểm tra kết nối",
    systemPrompt: "Bạn chỉ trả lời bằng hai chữ: OK CHAT.",
    temperature: 0,
    maxTokens: 16,
  },
];