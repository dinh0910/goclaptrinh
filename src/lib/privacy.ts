/**
 * Che IP trước khi hiển thị trong admin.
 *
 * Lý do không hiện IP gốc: nó là dữ liệu cá nhân theo Nghị định 13/2023, còn
 * mọi việc vận hành mà ta thực sự cần (thấy nhiều lần gửi từ cùng một mạng) thì
 * /24 và /48 vẫn đủ. Che ở tầng data chứ không phải ở UI, để IP gốc không bao
 * giờ đi vào payload gửi tới trình duyệt.
 */

const IPV6_GROUP = /^[0-9a-f]{1,4}$/;

/** Bung IPv6 về đủ 8 nhóm, xử lý dạng nén `::`. Trả về null nếu không hợp lệ. */
function expandIpv6(ip: string): string[] | null {
  const compressedAt = ip.indexOf("::");
  const groups =
    compressedAt === -1
      ? ip.split(":")
      : // "::" chỉ được xuất hiện một lần; hai lần là chuỗi không hợp lệ.
        ip.indexOf("::", compressedAt + 1) !== -1
        ? null
        : (() => {
            const head = ip.slice(0, compressedAt).split(":").filter(Boolean);
            const tail = ip.slice(compressedAt + 2).split(":").filter(Boolean);
            // `::` phải che được ít nhất một nhóm, nên tổng không được vượt 8.
            if (head.length + tail.length > 7) return null;
            return [...head, ...Array(8 - head.length - tail.length).fill("0"), ...tail];
          })();

  if (!groups || groups.length !== 8) return null;
  if (!groups.every((g) => IPV6_GROUP.test(g))) return null;
  return groups;
}

/** IPv4 giữ 2 octet đầu, IPv6 giữ 3 nhóm đầu. Dùng regex để không phụ thuộc `net`. */
export function maskIp(raw: string): string {
  const ip = (raw || "").trim().toLowerCase();
  if (!ip) return "";

  // Dạng IPv4 nằm trong IPv6 (::ffff:127.0.0.1) có cả "." và ":", phải xử lý
  // trước — nếu không nó rơi vào nhánh IPv4 và regex sẽ không khớp, ra chuỗi rỗng.
  if (ip.includes(".") && ip.includes(":")) {
    return maskIp(ip.slice(ip.lastIndexOf(":") + 1));
  }

  if (ip.includes(".")) {
    const m = /^(\d{1,3})\.(\d{1,3})\./.exec(ip);
    return m ? `${m[1]}.${m[2]}.x.x` : "";
  }

  if (ip.includes(":")) {
    // Loopback không định danh ai cả, giữ nguyên để còn nhận ra là "chính máy
    // này" thay vì chuỗi che vô nghĩa.
    if (ip === "::1") return "::1";

    const groups = expandIpv6(ip);
    if (!groups) return "";

    // Giữ 3 nhóm đầu, che phần còn lại nhưng giữ nguyên số nhóm để kết quả
    // vẫn là một địa chỉ IPv6 đọc được.
    return [...groups.slice(0, 3), ...groups.slice(3).map(() => "x")].join(":");
  }

  return "";
}
