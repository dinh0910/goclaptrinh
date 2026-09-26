/**
 * Nội dung trang chính sách (bảo mật, điều khoản, liên hệ...).
 *
 * Lưu chung trong bảng `settings` dưới một key JSON thay vì tạo bảng riêng: các
 * trang này là nội dung tĩnh, luôn có đúng một bản hiện hành, không cần query
 * lọc/sắp xếp phức tạp — cùng pattern với `hero`, `site_info`, `welcome_items`.
 */
export interface PolicyDoc {
  /** Đoạn cuối URL: /chinh-sach/<slug>. Chỉ chữ thường, số, gạch nối. */
  slug: string;
  title: string;
  /** Mô tả ngắn, dùng cho thẻ meta và danh sách. */
  summary: string;
  /** HTML đã qua sanitize. */
  content: string;
  published: boolean;
  updatedAt: string;
}

export const MAX_POLICIES = 50;
export const MAX_POLICY_CONTENT_LENGTH = 200_000;
export const MAX_POLICY_TITLE_LENGTH = 200;
export const MAX_POLICY_SUMMARY_LENGTH = 300;
export const MAX_POLICY_SLUG_LENGTH = 80;

/** Slug chỉ gồm chữ thường không dấu, số và gạch nối — để URL sạch và khỏi rơi vào đường dẫn lạ. */
export const POLICY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidPolicySlug(slug: string): boolean {
  return (
    slug.length > 0 &&
    slug.length <= MAX_POLICY_SLUG_LENGTH &&
    POLICY_SLUG_PATTERN.test(slug)
  );
}

/**
 * Bản nháp ban đầu. Nội dung mô tả đúng những gì mã nguồn đang làm (xem
 * `src/lib/retention.ts` và bảng `page_views`) chứ không phải lời pháp lý — cần
 * người quản trị rà lại trước khi xuất bản.
 */
export const DEFAULT_POLICIES: PolicyDoc[] = [
  {
    slug: "bao-mat",
    title: "Chính sách bảo mật",
    summary:
      "Dữ liệu nào được thu thập, dùng để làm gì, giữ bao lâu và cách yêu cầu xoá.",
    published: false,
    updatedAt: "",
    content: [
      "<h2>1. Dữ liệu chúng tôi thu thập</h2>",
      "<p>Chúng tôi chỉ thu thập những gì cần thiết để vận hành website, không dùng cookie hay pixel của bên thứ ba.</p>",
      "<ul>",
      "<li><strong>Dữ liệu bạn tự nhập:</strong> họ tên, email khi gửi bình luận hoặc đăng ký nhận bản tin; họ tên, email, số điện thoại khi dùng khung chat.</li>",
      "<li><strong>Dữ liệu kỹ thuật:</strong> địa chỉ IP, trình duyệt, múi giờ và kích thước màn hình, ghi lại khi bạn xem một trang.</li>",
      "<li><strong>Dữ liệu tài khoản:</strong> khi bạn đăng nhập quản trị, bao gồm khoá xác thực hai lớp nếu bạn bật.</li>",
      "</ul>",
      "<h2>2. Mục đích sử dụng</h2>",
      "<p>Để hiển thị bình luận và khung chat, gửi bản tin bạn đã đăng ký, chống lạm dụng và spam, cùng thống kê lượng truy cập ẩn danh.</p>",
      "<h2>3. Thời hạn lưu giữ</h2>",
      "<ul>",
      "<li>Nội dung và thông tin liên hệ của khung chat được giữ để tra cứu vận hành.</li>",
      "<li>Địa chỉ IP và dấu vân thiết bị trong lượt xem trang và trong hội thoại chat đã đóng sẽ bị xoá sau thời hạn lưu, tính từ thời điểm cuối cùng hoạt động.</li>",
      "</ul>",
      "<h2>4. Chia sẻ dữ liệu</h2>",
      "<p>Chúng tôi không bán, trao đổi hay chia sẻ dữ liệu cá nhân của bạn cho bên thứ ba vì mục đích thương mại.</p>",
      "<h2>5. Quyền của bạn</h2>",
      "<p>Bạn có quyền xem, yêu cầu sửa hoặc xoá dữ liệu cá nhân của mình. Liên hệ chúng tôi qua thông tin ở trang liên hệ, kèm địa chỉ email hoặc số điện thoại đã dùng, để chúng tôi xác định đúng tài khoản cần xử lý.</p>",
    ].join(""),
  },
  {
    slug: "dieu-khoan",
    title: "Điều khoản sử dụng",
    summary: "Các quy định khi bạn truy cập và sử dụng website.",
    published: false,
    updatedAt: "",
    content: [
      "<h2>1. Phạm vi</h2>",
      "<p>Điều khoản này áp dụng khi bạn truy cập website. Khi tiếp tục sử dụng, bạn đồng ý với các nội dung dưới đây.</p>",
      "<h2>2. Nội dung do người dùng gửi</h2>",
      "<p>Bạn chịu trách nhiệm về nội dung bình luận, tin nhắn và thông tin bạn gửi. Chúng tôi có quyền xoá nội dung không phù hợp.</p>",
      "<h2>3. Tài nguyên trí tuệ</h2>",
      "<p>Toàn bộ bài viết trên website được phép sử dụng lại cho mục đích học tập và phi thương mại khi ghi nguồn.</p>",
      "<h2>4. Giới hạn trách nhiệm</h2>",
      "<p>Thông tin trên website mang tính tham khảo. Chúng tôi không chịu trách nhiệm với thiệt hại phát sinh từ việc sử dụng nội dung này.</p>",
      "<h2>5. Thay đổi điều khoản</h2>",
      "<p>Chúng tôi có thể cập nhật điều khoản này. Phiên bản mới nhất luôn hiển thị trên trang này.</p>",
    ].join(""),
  },
];

export function emptyPolicy(): PolicyDoc {
  return {
    slug: "",
    title: "",
    summary: "",
    content: "",
    published: false,
    updatedAt: "",
  };
}
