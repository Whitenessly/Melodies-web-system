# Melodies Web System

## Mục tiêu
* [cite_start]**Nền tảng âm nhạc trực tuyến** là một hệ thống cho phép người dùng tải lên, chia sẻ và nghe nhạc. [cite: 3]
* [cite_start]Hệ thống cung cấp các công cụ để **nghệ sĩ** có thể tải lên các bài hát, album và theo dõi sự tương tác của người nghe. [cite: 4]
* [cite_start]**Người nghe** có thể tìm kiếm, nghe và quản lý các danh sách phát cá nhân. [cite: 5]
* [cite_start]**Admin** quản lý toàn bộ hoạt động của hệ thống, bao gồm quản lý nghệ sĩ, người nghe và nội dung âm nhạc. [cite: 6]

---

## Phạm vi
* [cite_start]Nền tảng âm nhạc bao gồm các tính năng quản lý nội dung âm nhạc, người dùng, tương tác xã hội và báo cáo. [cite: 8]
* [cite_start]Hệ thống cho phép **Admin** quản lý và kiểm soát toàn bộ thông tin người dùng, nội dung âm nhạc và các quy trình liên quan. [cite: 9]
* [cite_start]**Nghệ sĩ** có thể tải lên, quản lý các bài hát và theo dõi sự tương tác của người nghe. [cite: 10]
* [cite_start]**Người nghe** có thể tìm kiếm, nghe nhạc và quản lý danh sách phát cá nhân. [cite: 11]

---

## Đối tượng (Roles)

| STT | Role | Description |
| :--- | :--- | :--- |
| 1 | Admin (Quản trị viên) | [cite_start]Quản lý và kiểm soát toàn bộ hệ thống, bao gồm người dùng và nội dung âm nhạc. [cite: 13] |
| 2 | Artist (Nghệ sĩ) | [cite_start]Tải lên và quản lý các bài hát, album, và theo dõi sự tương tác của người nghe. [cite: 13] |
| 3 | Listener (Người nghe) | [cite_start]Tìm kiếm, nghe nhạc, và quản lý danh sách phát cá nhân. [cite: 13] |

---

## Chức năng chính

### 1. Quản trị viên (Admin)
* [cite_start]**Tác nhân:** Admin [cite: 15]

| Mã | Chức năng | Mô tả | Điều kiện |
| :--- | :--- | :--- | :--- |
| **AD-MSC01** | Quản lý nghệ sĩ | Xem, thêm, chỉnh sửa và xóa thông tin nghệ sĩ | [cite_start]Admin đã đăng nhập hệ thống [cite: 15] |
| **AD-MSC02** | Quản lý người nghe | Xem, thêm, chỉnh sửa và xóa thông tin người nghe | [cite_start]Admin đã đăng nhập hệ thống [cite: 15] |
| **AD-MSC03** | Quản lý bài hát | Xem và quản lý các bài hát được tải lên | [cite_start]Admin đã đăng nhập hệ thống [cite: 15] |
| **AD-MSC04** | Quản lý album | Xem và quản lý các album được tải lên | [cite_start]Admin đã đăng nhập hệ thống [cite: 15] |
| **AD-MSC05** | Quản lý danh mục | Tạo và quản lý các danh mục âm nhạc (thể loại, phong cách) | [cite_start]Admin đã đăng nhập hệ thống [cite: 15] |
| **AD-MSC06** | Quản lý đánh giá | Xem và quản lý các đánh giá và nhận xét từ người nghe | [cite_start]Admin đã đăng nhập hệ thống [cite: 15] |
| **AD-MSC07** | Quản lý thông báo | Gửi thông báo đến nghệ sĩ và người nghe | [cite_start]Admin đã đăng nhập hệ thống [cite: 15] |
| **AD-MSC08** | Quản lý hỗ trợ | Quản lý và cung cấp hỗ trợ kỹ thuật cho nghệ sĩ và người nghe | [cite_start]Admin đã đăng nhập hệ thống [cite: 15] |
| **AD-MSC09** | Quản lý bảo mật | Quản lý và thiết lập các biện pháp bảo mật cho hệ thống | [cite_start]Admin đã đăng nhập hệ thống [cite: 15] |
| **AD-MSC10** | Quản lý báo cáo | Xem và xuất các báo cáo về hoạt động của hệ thống | [cite_start]Admin đã đăng nhập hệ thống [cite: 15] |
| **AD-MSC11** | Quản lý nội dung không phù hợp | Theo dõi và xử lý các nội dung không phù hợp | [cite_start]Admin đã đăng nhập hệ thống [cite: 15] |
| **AD-MSC12** | Quản lý quảng cáo | Thiết lập và quản lý các chiến dịch quảng cáo | [cite_start]Admin đã đăng nhập hệ thống [cite: 15] |
| **AD-MSC13** | Quản lý tài khoản thanh toán | Quản lý và cấu hình các tài khoản thanh toán | [cite_start]Admin đã đăng nhập hệ thống [cite: 15] |
| **AD-MSC14** | Quản lý gói dịch vụ | Thiết lập và quản lý các gói dịch vụ cho người dùng | [cite_start]Admin đã đăng nhập hệ thống [cite: 15] |
| **AD-MSC15** | Quản lý quyền truy cập | Thiết lập và quản lý quyền truy cập cho từng loại người dùng | [cite_start]Admin đã đăng nhập hệ thống [cite: 15] |

### 2. Nghệ sĩ (Artist)
* [cite_start]**Tác nhân:** Artist (Nghệ sĩ) [cite: 16]

| Mã | Chức năng | Mô tả | Điều kiện |
| :--- | :--- | :--- | :--- |
| **ART-REG01** | Đăng ký tài khoản | Đăng ký tài khoản mới để sử dụng hệ thống | [cite_start]Không [cite: 16] |
| **ART-LOG01** | Đăng nhập | Đăng nhập vào hệ thống | [cite_start]Tài khoản đã được đăng ký [cite: 16] |
| **ART-ULD01** | Tải lên bài hát | Tải lên các bài hát mới | [cite_start]Artist đã đăng nhập hệ thống [cite: 16] |
| **ART-ULD02** | Tải lên album | Tạo và tải lên các album mới | [cite_start]Artist đã đăng nhập hệ thống [cite: 16] |
| **ART-MNG01** | Quản lý bài hát | Xem, chỉnh sửa và xóa các bài hát đã tải lên | [cite_start]Artist đã đăng nhập hệ thống [cite: 16] |
| **ART-MNG02** | Quản lý album | Xem, chỉnh sửa và xóa các album đã tải lên | [cite_start]Artist đã đăng nhập hệ thống [cite: 16] |
| **ART-STT01** | Xem thống kê nghe nhạc | Xem số lượt nghe, lượt thích và bình luận của các bài hát, album | [cite_start]Artist đã đăng nhập hệ thống [cite: 16] |
| **ART-NTF01** | Xem thông báo | Xem các thông báo từ hệ thống và từ Admin | [cite_start]Artist đã đăng nhập hệ thống [cite: 16] |
| **ART-SPT01** | Yêu cầu hỗ trợ | Gửi yêu cầu hỗ trợ kỹ thuật hoặc thắc mắc | [cite_start]Artist đã đăng nhập hệ thống [cite: 16] |
| **ART-ACC01** | Quản lý tài khoản | Xem và chỉnh sửa thông tin tài khoản cá nhân | [cite_start]Artist đã đăng nhập hệ thống [cite: 16] |
| **ART-RPT01** | Xem báo cáo thu nhập | Xem báo cáo thu nhập từ các lượt nghe và doanh thu từ quảng cáo | [cite_start]Artist đã đăng nhập hệ thống [cite: 16] |
| **ART-PRM01** | Quản lý khuyến mãi | Tạo và quản lý các chương trình khuyến mãi cho bài hát và album | [cite_start]Artist đã đăng nhập hệ thống [cite: 16] |
| **ART-COL01** | Tạo danh sách phát | Tạo và quản lý các danh sách phát cá nhân | [cite_start]Artist đã đăng nhập hệ thống [cite: 16] |
| **ART-COM01** | Quản lý bình luận | Xem và quản lý các bình luận từ người nghe | [cite_start]Artist đã đăng nhập hệ thống [cite: 16] |

### 3. Người nghe (Listener)
* [cite_start]**Tác nhân:** Listener (Người nghe) [cite: 17]

| Mã | Chức năng | Mô tả | Điều kiện |
| :--- | :--- | :--- | :--- |
| **LIS-REG01** | Đăng ký tài khoản | Đăng ký tài khoản mới để sử dụng hệ thống | [cite_start]Không [cite: 17] |
| **LIS-LOG01** | Đăng nhập | Đăng nhập vào hệ thống | [cite_start]Tài khoản đã được đăng ký [cite: 17] |
| **LIS-SRH01** | Tìm kiếm bài hát và album | Tìm kiếm các bài hát và album theo tên, nghệ sĩ, hoặc thể loại | [cite_start]Listener đã đăng nhập hệ thống [cite: 17] |
| **LIS-PLY01** | Nghe nhạc trực tuyến | Nghe các bài hát và album trực tuyến | [cite_start]Listener đã đăng nhập hệ thống [cite: 17] |
| **LIS-DWL01** | Tải nhạc xuống | Tải các bài hát và album về thiết bị cá nhân | [cite_start]Listener đã đăng nhập hệ thống [cite: 17] |
| **LIS-LIB01** | Quản lý thư viện nhạc | Quản lý thư viện nhạc cá nhân, bao gồm danh sách phát và yêu thích | [cite_start]Listener đã đăng nhập hệ thống [cite: 17] |
| **LIS-NTF01** | Xem thông báo | Xem các thông báo từ hệ thống và từ nghệ sĩ | [cite_start]Listener đã đăng nhập hệ thống [cite: 17] |
| **LIS-CMT01** | Bình luận và đánh giá | Bình luận và đánh giá các bài hát và album | [cite_start]Listener đã đăng nhập hệ thống [cite: 17] |
| **LIS-SPT01** | Yêu cầu hỗ trợ | Gửi yêu cầu hỗ trợ kỹ thuật hoặc thắc mắc | [cite_start]Listener đã đăng nhập hệ thống [cite: 17] |
| **LIS-ACC01** | Quản lý tài khoản | Xem và chỉnh sửa thông tin tài khoản cá nhân | [cite_start]Listener đã đăng nhập hệ thống [cite: 17] |
| **LIS-SUB01** | Theo dõi nghệ sĩ | Theo dõi và nhận thông báo từ nghệ sĩ yêu thích | [cite_start]Listener đã đăng nhập hệ thống [cite: 17] |
| **LIS-PRM01** | Xem chương trình khuyến mãi | Xem và tham gia các chương trình khuyến mãi | [cite_start]Listener đã đăng nhập hệ thống [cite: 17] |
| **LIS-SHR01** | Chia sẻ nhạc | Chia sẻ bài hát và album với bạn bè qua mạng xã hội | [cite_start]Listener đã đăng nhập hệ thống [cite: 17] |
| **LIS-RPT01** | Xem báo cáo nghe nhạc | Xem báo cáo về thói quen nghe nhạc cá nhân | [cite_start]Listener đã đăng nhập hệ thống [cite: 17] |

---

## Giao diện
* [cite_start]**Figma (Tham khảo):** [Link] [cite: 19]

### [cite_start]Một số giao diện nên có [cite: 20]

| Giao diện | Mô tả | Chức năng |
| :--- | :--- | :--- |
| **Admin** | | |
| Trang quản lý nghệ sĩ (Artist Management Page) | Hiển thị danh sách nghệ sĩ, với các nút thêm mới, chỉnh sửa và xóa thông tin nghệ sĩ. | [cite_start]AD-MSC01 [cite: 21] |
| Trang quản lý người nghe (Listener Management Page) | Hiển thị danh sách người nghe, với các nút thêm mới, chỉnh sửa và xóa thông tin người nghe. | [cite_start]AD-MSC02 [cite: 21] |
| Trang quản lý bài hát (Song Management Page) | Hiển thị danh sách các bài hát được tải lên, cho phép xem chi tiết và quản lý bài hát. | [cite_start]AD-MSC03 [cite: 21] |
| Trang quản lý album (Album Management Page) | Hiển thị danh sách các album được tải lên, cho phép xem chi tiết và quản lý album. | [cite_start]AD-MSC04 [cite: 21] |
| Trang quản lý danh mục (Category Management Page) | Hiển thị danh sách các danh mục âm nhạc, cho phép tạo và quản lý các danh mục này. | [cite_start]AD-MSC05 [cite: 21] |
| Trang quản lý đánh giá (Review Management Page) | Hiển thị danh sách các đánh giá và nhận xét từ người nghe, cho phép quản lý và xóa các đánh giá không phù hợp. | [cite_start]AD-MSC06 [cite: 21] |
| Trang quản lý thông báo (Notification Management Page) | Hiển thị danh sách thông báo, cho phép gửi thông báo đến nghệ sĩ và người nghe. | [cite_start]AD-MSC07 [cite: 21] |
| Trang quản lý hỗ trợ (Support Management Page) | Hiển thị danh sách yêu cầu hỗ trợ, cho phép quản lý và cung cấp hỗ trợ kỹ thuật cho nghệ sĩ và người nghe. | [cite_start]AD-MSC08 [cite: 21] |
| Trang quản lý bảo mật (Security Management Page) | Hiển thị các biện pháp bảo mật và cho phép thiết lập, chỉnh sửa bảo mật hệ thống. | [cite_start]AD-MSC09 [cite: 21] |
| Trang báo cáo (Report Page) | Hiển thị các báo cáo về hoạt động của hệ thống, bao gồm số lượng người dùng, lượt nghe và doanh thu. | [cite_start]AD-MSC10 [cite: 21] |
| Trang quản lý nội dung không phù hợp (Inappropriate Content Management Page) | Theo dõi và xử lý các nội dung không phù hợp. | [cite_start]AD-MSC11 [cite: 21] |
| Trang quản lý quảng cáo (Advertising Management Page) | Thiết lập và quản lý các chiến dịch quảng cáo. | [cite_start]AD-MSC12 [cite: 21] |
| Trang quản lý tài khoản thanh toán (Payment Account Management Page) | Quản lý và cấu hình các tài khoản thanh toán. | [cite_start]AD-MSC13 [cite: 21] |
| Trang quản lý gói dịch vụ (Service Package Management Page) | Thiết lập và quản lý các gói dịch vụ cho người dùng. | [cite_start]AD-MSC14 [cite: 21] |
| Trang quản lý quyền truy cập (Access Control Management Page) | Thiết lập và quản lý quyền truy cập cho từng loại người dùng. | [cite_start]AD-MSC15 [cite: 21] |
| **Artist (Nghệ sĩ)** | | |
| Trang đăng ký tài khoản (Registration Page) | Form đăng ký tài khoản mới, bao gồm các trường thông tin cần thiết như tên, email, mật khẩu, và xác nhận mật khẩu. | [cite_start]ART-REG01 [cite: 21] |
| Trang đăng nhập (Login Page) | Form đăng nhập vào hệ thống bằng email và mật khẩu. | [cite_start]ART-LOG01 [cite: 21] |
| Trang tải lên bài hát (Song Upload Page) | Form tải lên các bài hát mới, bao gồm các trường thông tin như tên bài hát, thể loại, và file nhạc. | [cite_start]ART-ULD01 [cite: 21] |
| Trang tải lên album (Album Upload Page) | Form tạo và tải lên các album mới, bao gồm các trường thông tin như tên album, thể loại, và các bài hát. | [cite_start]ART-ULD02 [cite: 21] |
| Trang quản lý bài hát (Song Management Page) | Hiển thị danh sách các bài hát đã tải lên, cho phép xem chi tiết, chỉnh sửa và xóa bài hát. | [cite_start]ART-MNG01 [cite: 21] |
| Trang quản lý album (Album Management Page) | Hiển thị danh sách các album đã tải lên, cho phép xem chi tiết, chỉnh sửa và xóa album. | [cite_start]ART-MNG02 [cite: 21] |
| Trang thống kê nghe nhạc (Listening Statistics Page) | Hiển thị các thống kê về số lượt nghe, lượt thích và bình luận của các bài hát và album. | [cite_start]ART-STT01 [cite: 21] |
| Trang xem thông báo (Notification Viewing Page) | Hiển thị các thông báo từ hệ thống và từ Admin. | [cite_start]ART-NTF01 [cite: 21] |
| Trang yêu cầu hỗ trợ (Support Request Page) | Form gửi yêu cầu hỗ trợ kỹ thuật hoặc thắc mắc. | [cite_start]ART-SPT01 [cite: 21] |
| Trang quản lý tài khoản (Account Management Page) | Hiển thị và cho phép chỉnh sửa thông tin tài khoản cá nhân. | [cite_start]ART-ACC01 [cite: 21] |
| Trang báo cáo thu nhập (Income Report Page) | Hiển thị các báo cáo thu nhập từ các lượt nghe và doanh thu từ quảng cáo. | [cite_start]ART-RPT01 [cite: 21] |
| Trang quản lý khuyến mãi (Promotion Management Page) | Hiển thị danh sách các chương trình khuyến mãi, cho phép tạo và quản lý các chương trình khuyến mãi. | [cite_start]ART-PRM01 [cite: 21] |
| Trang tạo danh sách phát (Playlist Creation Page) | Form tạo và quản lý các danh sách phát cá nhân. | [cite_start]ART-COL01 [cite: 21] |
| Trang quản lý bình luận (Comment Management Page) | Hiển thị danh sách các bình luận từ người nghe, cho phép xem và xóa các bình luận không phù hợp. | [cite_start]ART-COM01 [cite: 21] |
| **Listener (Người nghe)** | | |
| Trang đăng ký tài khoản (Registration Page) | Form đăng ký tài khoản mới, bao gồm các trường thông tin cần thiết như tên, email, mật khẩu, và xác nhận mật khẩu. | [cite_start]LIS-REG01 [cite: 21] |
| Trang đăng nhập (Login Page) | Form đăng nhập vào hệ thống bằng email và mật khẩu. | [cite_start]LIS-LOG01 [cite: 21] |
| Trang tìm kiếm bài hát và album (Search Page) | Form tìm kiếm các bài hát và album theo tên, nghệ sĩ, hoặc thể loại. | [cite_start]LIS-SRH01 [cite: 21] |
| Trang nghe nhạc trực tuyến (Online Listening Page) | Hiển thị trình phát nhạc cho phép nghe các bài hát và album trực tuyến. | [cite_start]LIS-PLY01 [cite: 21] |
| Trang tải nhạc xuống (Download Page) | Hiển thị danh sách các bài hát và album cho phép tải về thiết bị cá nhân. | [cite_start]LIS-DWL01 [cite: 21] |
| Trang quản lý thư viện nhạc (Music Library Management Page) | Hiển thị thư viện nhạc cá nhân, bao gồm danh sách phát và các bài hát yêu thích. | [cite_start]LIS-LIB01 [cite: 21] |
| Trang xem thông báo (Notification Viewing Page) | Hiển thị các thông báo từ hệ thống và từ nghệ sĩ. | [cite_start]LIS-NTF01 [cite: 21] |
| Trang bình luận và đánh giá (Comment and Rating Page) | Form cho phép bình luận và đánh giá các bài hát và album. | [cite_start]LIS-CMT01 [cite: 21] |
| Trang yêu cầu hỗ trợ (Support Request Page) | Form gửi yêu cầu hỗ trợ kỹ thuật hoặc thắc mắc. | [cite_start]LIS-SPT01 [cite: 21] |
| Trang quản lý tài khoản (Account Management Page) | Hiển thị và cho phép chỉnh sửa thông tin tài khoản cá nhân. | [cite_start]LIS-ACC01 [cite: 21] |
| Trang theo dõi nghệ sĩ (Artist Follow Page) | Hiển thị danh sách các nghệ sĩ yêu thích và cho phép theo dõi nhận thông báo từ nghệ sĩ. | [cite_start]LIS-SUB01 [cite: 21] |
| Trang xem chương trình khuyến mãi (Promotion Viewing Page) | Hiển thị các chương trình khuyến mãi và cho phép tham gia. | [cite_start]LIS-PRM01 [cite: 21] |
| Trang chia sẻ nhạc (Music Sharing Page) | Hiển thị các bài hát và album cho phép chia sẻ qua mạng xã hội. | [cite_start]LIS-SHR01 [cite: 21] |
| Trang báo cáo nghe nhạc (Listening Report Page) | Hiển thị các báo cáo về thói quen nghe nhạc cá nhân. | [cite_start]LIS-RPT01 [cite: 21] |