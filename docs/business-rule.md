# TÀI LIỆU QUY TRÌNH - NGHIỆP VỤ HỆ THỐNG "MELODIES WEB SYSTEM"

## I. Giới thiệu chung
**Melodies Web System** là một nền tảng âm nhạc trực tuyến cho phép người dùng tải lên, chia sẻ và nghe nhạc. Hệ thống cung cấp các công cụ hỗ trợ nghệ sĩ quản lý sản phẩm âm nhạc cá nhân và theo dõi tương tác của người nghe. Đồng thời, hệ thống cung cấp các tính năng giúp người nghe tìm kiếm, trải nghiệm âm nhạc và quản lý cá nhân hóa. Toàn bộ hoạt động của hệ thống được giám sát, quản lý và vận hành bởi Quản trị viên (Admin).

---

## II. Các đối tượng sử dụng hệ thống (Actors)
Hệ thống phân quyền rõ ràng cho 3 đối tượng sử dụng chính:

1. **Admin (Quản trị viên):** Người có quyền kiểm soát cao nhất, quản lý toàn bộ hệ thống bao gồm người dùng (nghệ sĩ, người nghe), nội dung âm nhạc, bảo mật, báo cáo doanh thu và xử lý vi phạm.
2. **Artist (Nghệ sĩ):** Người sáng tạo nội dung, có quyền tải lên bài hát, album, theo dõi thống kê lượt nghe, doanh thu, quản lý danh sách phát và tương tác với người nghe qua bình luận, chương trình khuyến mãi.
3. **Listener (Người nghe):** Người tiêu thụ nội dung, có quyền tìm kiếm, nghe nhạc trực tuyến, tải nhạc, tạo danh sách phát cá nhân, theo dõi nghệ sĩ và gửi đánh giá/bình luận.

---

## III. Quy trình nghiệp vụ chính (Key Business Workflows)

### 1. Quy trình Đăng ký & Đăng nhập (Authentication Workflow)
* **Đối với Người dùng mới (Artist & Listener):**
  * Đăng ký tài khoản bằng cách điền các thông tin cơ bản: Tên, Email, Mật khẩu và Xác nhận mật khẩu.
  * Sau khi đăng ký thành công, tài khoản được lưu trữ trên hệ thống và có thể sử dụng để đăng nhập.
* **Đăng nhập:** Người dùng thực hiện đăng nhập bằng Email và Mật khẩu đã đăng ký để sử dụng đầy đủ các tính năng của vai trò tương ứng.

### 2. Quy trình Quản lý và Tải lên Âm nhạc của Nghệ sĩ (Music Upload & Management Workflow)
* **Tải bài hát lẻ:** Nghệ sĩ điền thông tin (tên bài hát, thể loại) và tải lên file âm thanh.
* **Tạo Album:** Nghệ sĩ tạo album bằng cách điền thông tin album (tên album, thể loại) và liên kết các bài hát trong album đó.
* **Quản lý sản phẩm:** Nghệ sĩ có quyền xem danh sách bài hát/album đã tải, chỉnh sửa thông tin hoặc xóa khi cần thiết.
* **Theo dõi tương tác:** Hệ thống ghi nhận lượt nghe, lượt thích, bình luận từ người nghe để nghệ sĩ theo dõi thông qua trang thống kê.

### 3. Quy trình Nghe nhạc & Tương tác của Người nghe (Listening & Interaction Workflow)
* **Tìm kiếm:** Người nghe tìm kiếm bài hát hoặc album dựa trên các từ khóa liên quan đến tên bài hát, nghệ sĩ hoặc thể loại nhạc.
* **Nghe nhạc:** Hệ thống hỗ trợ phát nhạc trực tuyến trực tiếp trên trình duyệt.
* **Tương tác trực tiếp:** Người nghe có thể lưu bài hát vào danh sách phát (playlist) cá nhân, tải nhạc về thiết bị, theo dõi nghệ sĩ để nhận thông báo mới, viết bình luận và đánh giá sản phẩm.

### 4. Quy trình Kiểm duyệt và Quản trị của Admin (System Moderation & Management Workflow)
* **Giám sát nội dung:** Admin theo dõi các bài hát, album mới được tải lên hệ thống.
* **Xử lý vi phạm:** Admin theo dõi và xử lý các nội dung không phù hợp (Inappropriate Content) hoặc xóa các đánh giá/bình luận tiêu cực, không tuân thủ quy chuẩn cộng đồng.
* **Hỗ trợ người dùng:** Tiếp nhận và xử lý các yêu cầu hỗ trợ kỹ thuật hoặc giải đáp thắc mắc từ cả Nghệ sĩ và Người nghe.

---

## IV. Các quy tắc & Quy luật hệ thống (Business Rules)

1. **Quy tắc phân quyền truy cập (Access Control Rule):**
   * Người dùng chưa đăng nhập chỉ có quyền truy cập trang đăng ký/đăng nhập.
   * Tất cả các tính năng cốt lõi (nghe nhạc, tải nhạc, quản lý thư viện, tải lên nhạc, quản trị...) đều yêu cầu điều kiện **"Đã đăng nhập vào hệ thống"**.
2. **Quy tắc sở hữu nội dung (Content Ownership Rule):**
   * Nghệ sĩ chỉ có quyền chỉnh sửa, xóa và xem số liệu thống kê đối với các bài hát và album do chính họ tải lên.
   * Người nghe chỉ có quyền quản lý thông tin cá nhân và thư viện nhạc cá nhân (playlist tự tạo, danh sách bài hát yêu thích).
3. **Quy tắc kiểm duyệt nội dung (Moderation Rule):**
   * Admin có quyền tối cao trong việc can thiệp vào dữ liệu hệ thống, bao gồm quyền xóa bài hát, album, bình luận của bất kỳ người dùng nào nếu vi phạm chính sách nội dung.
4. **Quy tắc tương tác xã hội (Social Interaction Rule):**
   * Khi nghệ sĩ tải lên bài hát hoặc album mới, hệ thống sẽ tự động gửi thông báo đến những người nghe đang "Theo dõi" (Follow) nghệ sĩ đó.

---

## V. Chi tiết danh sách tính năng theo Tác nhân (Feature List)

### 1. Phân hệ Admin (Quản trị viên)

| Mã tính năng | Tên tính năng | Mô tả chi tiết | Điều kiện thực hiện |
| :--- | :--- | :--- | :--- |
| **AD-MSC01** | Quản lý nghệ sĩ | Xem, thêm, chỉnh sửa và xóa thông tin tài khoản nghệ sĩ. | Đã đăng nhập vai trò Admin |
| **AD-MSC02** | Quản lý người nghe | Xem, thêm, chỉnh sửa và xóa thông tin tài khoản người nghe. | Đã đăng nhập vai trò Admin |
| **AD-MSC03** | Quản lý bài hát | Xem và quản lý (duyệt/xóa) các bài hát được tải lên hệ thống. | Đã đăng nhập vai trò Admin |
| **AD-MSC04** | Quản lý album | Xem và quản lý các album được tạo trên hệ thống. | Đã đăng nhập vai trò Admin |
| **AD-MSC05** | Quản lý danh mục | Tạo và quản lý các danh mục âm nhạc (thể loại, phong cách). | Đã đăng nhập vai trò Admin |
| **AD-MSC06** | Quản lý đánh giá | Xem và quản lý các đánh giá, nhận xét từ người nghe. | Đã đăng nhập vai trò Admin |
| **AD-MSC07** | Quản lý thông báo | Soạn và gửi thông báo chung hoặc riêng đến nghệ sĩ và người nghe. | Đã đăng nhập vai trò Admin |
| **AD-MSC08** | Quản lý hỗ trợ | Quản lý và cung cấp hỗ trợ kỹ thuật cho nghệ sĩ và người nghe. | Đã đăng nhập vai trò Admin |
| **AD-MSC09** | Quản lý bảo mật | Quản lý và thiết lập các biện pháp bảo mật cho hệ thống. | Đã đăng nhập vai trò Admin |
| **AD-MSC10** | Quản lý báo cáo | Xem và xuất các báo cáo tổng quan về hoạt động của hệ thống (lượt nghe, người dùng mới, doanh thu). | Đã đăng nhập vai trò Admin |
| **AD-MSC11** | Quản lý nội dung không phù hợp | Theo dõi, tiếp nhận báo cáo và xử lý các nội dung vi phạm tiêu chuẩn. | Đã đăng nhập vai trò Admin |
| **AD-MSC12** | Quản lý quảng cáo | Thiết lập và quản lý các chiến dịch quảng cáo hiển thị trên hệ thống. | Đã đăng nhập vai trò Admin |
| **AD-MSC13** | Quản lý tài khoản thanh toán | Quản lý và cấu hình các tài khoản/cổng thanh toán tích hợp. | Đã đăng nhập vai trò Admin |
| **AD-MSC14** | Quản lý gói dịch vụ | Thiết lập và quản lý các gói dịch vụ (subscriptions) dành cho người dùng. | Đã đăng nhập vai trò Admin |
| **AD-MSC15** | Quản lý quyền truy cập | Thiết lập và cấu hình quyền hạn chi tiết cho từng loại vai trò người dùng. | Đã đăng nhập vai trò Admin |

### 2. Phân hệ Artist (Nghệ sĩ)

| Mã tính năng | Tên tính năng | Mô tả chi tiết | Điều kiện thực hiện |
| :--- | :--- | :--- | :--- |
| **ART-REG01** | Đăng ký tài khoản | Đăng ký tài khoản nghệ sĩ mới. | Chưa đăng nhập |
| **ART-LOG01** | Đăng nhập | Truy cập hệ thống bằng tài khoản nghệ sĩ. | Đã đăng ký tài khoản |
| **ART-ULD01** | Tải lên bài hát | Tải lên các file nhạc mới cùng thông tin đi kèm. | Đã đăng nhập vai trò Artist |
| **ART-ULD02** | Tải lên album | Tạo album mới và thêm các bài hát vào album. | Đã đăng nhập vai trò Artist |
| **ART-MNG01** | Quản lý bài hát | Xem, chỉnh sửa thông tin hoặc xóa bài hát cá nhân đã tải lên. | Đã đăng nhập vai trò Artist |
| **ART-MNG02** | Quản lý album | Xem, chỉnh sửa thông tin hoặc xóa album cá nhân đã tạo. | Đã đăng nhập vai trò Artist |
| **ART-STT01** | Xem thống kê nghe nhạc | Xem chi tiết số lượt nghe, lượt thích và số lượng bình luận của sản phẩm. | Đã đăng nhập vai trò Artist |
| **ART-NTF01** | Xem thông báo | Xem các thông báo từ hệ thống tự động hoặc từ Admin. | Đã đăng nhập vai trò Artist |
| **ART-SPT01** | Yêu cầu hỗ trợ | Gửi các yêu cầu hỗ trợ kỹ thuật hoặc thắc mắc liên quan đến vận hành. | Đã đăng nhập vai trò Artist |
| **ART-ACC01** | Quản lý tài khoản | Xem và chỉnh sửa thông tin hồ sơ cá nhân của nghệ sĩ. | Đã đăng nhập vai trò Artist |
| **ART-RPT01** | Xem báo cáo thu nhập | Theo dõi báo cáo doanh thu phát sinh từ lượt nghe và hiển thị quảng cáo. | Đã đăng nhập vai trò Artist |
| **ART-PRM01** | Quản lý khuyến mãi | Thiết lập các chương trình khuyến mãi/ưu đãi liên quan đến sản phẩm cá nhân. | Đã đăng nhập vai trò Artist |
| **ART-COL01** | Tạo danh sách phát | Tạo và quản lý danh sách phát cá nhân của nghệ sĩ. | Đã đăng nhập vai trò Artist |
| **ART-COM01** | Quản lý bình luận | Xem và quản lý (phản hồi hoặc ẩn/xóa) bình luận của người nghe trên nhạc của mình. | Đã đăng nhập vai trò Artist |

### 3. Phân hệ Listener (Người nghe)

| Mã tính năng | Tên tính năng | Mô tả chi tiết | Điều kiện thực hiện |
| :--- | :--- | :--- | :--- |
| **LIS-REG01** | Đăng ký tài khoản | Đăng ký tài khoản người nghe mới. | Chưa đăng nhập |
| **LIS-LOG01** | Đăng nhập | Truy cập hệ thống bằng tài khoản người nghe. | Đã đăng ký tài khoản |
| **LIS-SRH01** | Tìm kiếm bài hát và album | Tìm kiếm nội dung âm nhạc theo tên bài hát, nghệ sĩ hoặc thể loại. | Đã đăng nhập vai trò Listener |
| **LIS-PLY01** | Nghe nhạc trực tuyến | Nghe trực tiếp các bài hát lẻ hoặc các album trên hệ thống. | Đã đăng nhập vai trò Listener |
| **LIS-DWL01** | Tải nhạc xuống | Tải file nhạc/album về thiết bị cá nhân để nghe ngoại tuyến (offline). | Đã đăng nhập vai trò Listener |
| **LIS-LIB01** | Quản lý thư viện nhạc | Quản lý thư viện cá nhân bao gồm danh sách phát tự tạo và bài hát yêu thích. | Đã đăng nhập vai trò Listener |
| **LIS-NTF01** | Xem thông báo | Nhận và xem thông báo từ hệ thống hoặc từ các nghệ sĩ đang theo dõi. | Đã đăng nhập vai trò Listener |
| **LIS-CMT01** | Bình luận và đánh giá | Để lại ý kiến phản hồi, đánh giá điểm số cho các bài hát hoặc album. | Đã đăng nhập vai trò Listener |
| **LIS-SPT01** | Yêu cầu hỗ trợ | Gửi yêu cầu hỗ trợ kỹ thuật hoặc báo cáo lỗi cho hệ thống. | Đã đăng nhập vai trò Listener |
| **LIS-ACC01** | Quản lý tài khoản | Xem và cập nhật thông tin cá nhân của người dùng. | Đã đăng nhập vai trò Listener |
| **LIS-SUB01** | Theo dõi nghệ sĩ | Nhấn theo dõi nghệ sĩ yêu thích để cập nhật sản phẩm và hoạt động mới của họ. | Đã đăng nhập vai trò Listener |
| **LIS-PRM01** | Xem chương trình khuyến mãi | Xem và đăng ký tham gia các hoạt động ưu đãi/khuyến mãi trên nền tảng. | Đã đăng nhập vai trò Listener |
| **LIS-SHR01** | Chia sẻ nhạc | Chia sẻ liên kết của bài hát/album lên các nền tảng mạng xã hội khác. | Đã đăng nhập vai trò Listener |
| **LIS-RPT01** | Xem báo cáo nghe nhạc | Xem thống kê/phân tích cá nhân về thói quen nghe nhạc (xu hướng, dòng nhạc nghe nhiều). | Đã đăng nhập vai trò Listener |

---

## VI. Đặc tả chi tiết các tính năng kỹ thuật bổ sung

### 1. Phân hệ Trình phát nhạc (Music Player)
Trình phát nhạc là tính năng cốt lõi dành cho người dùng (đặc biệt là Listener) để trải nghiệm âm nhạc trực tuyến trên hệ thống với các nghiệp vụ cụ thể sau:

*   **Các điều khiển cơ bản (Play, Pause, Seek):**
    *   **Play/Pause:** Cho phép người dùng phát hoặc tạm dừng bài hát đang chọn. Hệ thống cần lưu lại trạng thái phát hiện tại để tiếp tục khi người dùng nhấn phát lại.
    *   **Seek (Tua nhạc):** Người dùng có thể kéo thanh tiến trình (progress bar) để di chuyển đến một mốc thời gian bất kỳ trong bài hát.
*   **Quản lý Hàng đợi phát (Queue / Player Playlist):**
    *   Hệ thống duy trì một danh sách các bài hát chuẩn bị phát (Hàng đợi). Người dùng có thể xem danh sách này, thêm bài hát mới vào hàng đợi hoặc thay đổi thứ tự ưu tiên của các bài hát.
*   **Chế độ phát (Trộn bài & Lặp lại):**
    *   **Trộn bài (Shuffle):** Hệ thống sẽ xáo trộn ngẫu nhiên thứ tự các bài hát trong hàng đợi phát hiện tại mà không làm thay đổi danh sách phát gốc của người dùng.
    *   **Lặp lại (Repeat):** Hỗ trợ hai chế độ lặp: Lặp lại toàn bộ danh sách phát (Repeat All) hoặc Lặp lại duy nhất một bài hát đang phát (Repeat One).
*   **Tự động chuyển bài (Autoplay):**
    *   Khi bài hát hiện tại kết thúc (thời gian phát đạt 100%), trình phát nhạc tự động chuyển sang bài tiếp theo trong hàng đợi phát dựa trên chế độ phát đã thiết lập (bình thường hoặc trộn bài).

---

### 2. Quản lý nội dung (Thêm và xóa bài hát)
Tính năng hỗ trợ quản lý vòng đời của các tệp tin âm thanh trên hệ thống:
*   **Thêm bài hát:** Cho phép tải lên tệp tin âm thanh (định dạng phổ biến như .mp3, .wav) kèm theo siêu dữ liệu (metadata) bao gồm: Tiêu đề bài hát, ca sĩ trình bày, thuộc album nào, thể loại và ảnh đại diện (thumbnail).
*   **Xóa bài hát:** 
    *   Nghệ sĩ có quyền xóa bài hát do chính họ đăng tải.
    *   Admin có quyền xóa bất kỳ bài hát nào vi phạm bản quyền hoặc tiêu chuẩn cộng đồng.
    *   *Quy tắc hệ thống:* Khi một bài hát bị xóa, hệ thống sẽ tự động gỡ bài hát đó ra khỏi toàn bộ các danh sách phát (playlist) hiện có của người dùng và hàng đợi phát của trình phát nhạc.

---

### 3. Phân hệ Người dùng & Xác thực (User & Authentication)
Đặc tả kỹ thuật cho việc đăng ký, đăng nhập và phân quyền hệ thống:

*   **Đăng ký / Đăng nhập (Register / Login):** Người dùng thực hiện đăng ký tài khoản bằng email và mật khẩu. Hệ thống mã hóa mật khẩu trước khi lưu trữ vào cơ sở dữ liệu.
*   **Cơ chế xác thực dựa trên Token (Token-based Authentication):**
    *   Sử dụng **Laravel Sanctum** hoặc **JWT (JSON Web Token)** để quản lý phiên đăng nhập của người dùng dưới dạng API không trạng thái (stateless).
    *   Khi đăng nhập thành công, hệ thống trả về một mã Token xác thực. Token này sẽ được đính kèm vào tiêu đề (Header) của các yêu cầu gửi từ phía máy khách (Client) lên máy chủ (Server) để xác minh danh tính.
*   **Phân quyền vai trò (Role-based Access Control):**
    *   **Admin:** Có quyền truy cập các API quản trị, cấu hình hệ thống, kiểm duyệt nội dung và quản lý người dùng.
    *   **User (bao gồm cả Artist và Listener):** Có quyền sử dụng các tính năng cá nhân như nghe nhạc, tạo playlist, tìm kiếm. Riêng tài khoản được nâng cấp quyền tác giả (Artist) sẽ có thêm quyền gọi các API đăng tải và quản lý nhạc.

---

### 4. Quản lý Playlist cá nhân (Playlist Management)
Tính năng cho phép người dùng cá nhân hóa trải nghiệm âm nhạc:

*   **Tạo danh sách phát (Create Playlist):** Người dùng có thể tạo một hoặc nhiều playlist mới, đặt tên và tải lên ảnh bìa đại diện cho danh sách đó.
*   **Thêm và xóa bài hát khỏi Playlist:**
    *   **Thêm bài hát:** Trong khi nghe nhạc hoặc tìm kiếm, người dùng có thể chọn thêm bài hát bất kỳ vào một hoặc nhiều playlist đã tạo.
    *   **Xóa bài hát:** Người dùng có thể truy cập vào playlist của mình và gỡ bỏ những bài hát không còn muốn nghe ra khỏi danh sách.
*   **Chế độ riêng tư (Public / Private):**
    *   **Public (Công khai):** Playlist hiển thị công khai, cho phép người dùng khác tìm kiếm, xem danh sách bài hát và nhấn nghe.
    *   **Private (Riêng tư):** Playlist chỉ hiển thị duy nhất đối với người dùng tạo ra nó. Các tài khoản khác không thể tìm thấy hoặc truy cập dưới mọi hình thức.

---

### 5. Hệ thống Tìm kiếm (Search Engine)
Tính năng hỗ trợ người dùng tiếp cận nhanh chóng với kho nội dung âm nhạc:

*   Hệ thống tìm kiếm hỗ trợ lọc kết quả dựa trên các trường thông tin chính:
    *   **Theo Bài hát:** Khớp từ khóa với tiêu đề bài hát (Song title).
    *   **Theo Ca sĩ/Nghệ sĩ:** Khớp từ khóa với tên nghệ sĩ trình bày hoặc nhóm nhạc (Artist name).
    *   **Theo Album:** Khớp từ khóa với tiêu đề album (Album title).
*   *Quy tắc tìm kiếm:* Hệ thống xử lý tìm kiếm không phân biệt chữ hoa, chữ thường và hỗ trợ tìm kiếm gần đúng (fuzzy search) để trả về kết quả phù hợp nhất cho người dùng.

---

### 6. Hệ thống Theo dõi & Thống kê (Tracking System)
Hệ thống ghi nhận và phân tích hành vi của người nghe để tối ưu hóa trải nghiệm và cung cấp dữ liệu cho nghệ sĩ/admin:

*   **Theo dõi lượt nghe (Views / Play Count):**
    *   *Quy tắc tính lượt nghe:* Một lượt nghe (view) chỉ được ghi nhận tăng thêm 1 khi bài hát được phát liên tục trong một khoảng thời gian tối thiểu theo quy định (ví dụ: phát tối thiểu 30 giây đầu tiên hoặc đạt 50% thời lượng bài hát) để tránh việc tăng lượt nghe ảo (spam views).
*   **Danh sách phát gần đây (Recently Played):**
    *   Hệ thống tự động lưu trữ lịch sử phát nhạc của từng người dùng cụ thể. Danh sách này lưu giữ các bài hát được phát gần nhất theo thứ tự thời gian giảm dần, giúp người dùng dễ dàng tìm và nghe lại các bài hát vừa thưởng thức.
*   **Bảng xếp hạng bài hát nổi bật (Top Songs):**
    *   Dựa trên tổng số lượt nghe (views) trong một khoảng thời gian nhất định (theo ngày, tuần hoặc tháng), hệ thống tự động tổng hợp dữ liệu và xuất ra danh sách các bài hát có lượng tương tác cao nhất để hiển thị tại trang chủ.