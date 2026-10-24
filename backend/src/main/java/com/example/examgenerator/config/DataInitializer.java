package com.example.examgenerator.config;

import com.example.examgenerator.dto.request.ExamRequest;
import com.example.examgenerator.entity.*;
import com.example.examgenerator.enumerate.DifficultyLevel;
import com.example.examgenerator.enumerate.ExamStructureType;
import com.example.examgenerator.enumerate.QuestionType;
import com.example.examgenerator.repository.*;
import com.example.examgenerator.service.ExamGeneratorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final DepartmentGroupRepository departmentGroupRepository;
    private final SubjectRepository subjectRepository;
    private final CourseRepository courseRepository;
    private final QuestionRepository questionRepository;
    private final ExamRepository examRepository;
    private final ExamGeneratorService examGeneratorService;

    @Override
    public void run(String... args) {
        if (departmentRepository.count() == 0 || questionRepository.count() < 10) {
            log.info("Database is empty or has minimal data. Starting comprehensive seed data initialization...");
            seedData();
            log.info("Comprehensive seed data initialization completed successfully!");
        } else {
            log.info("Database already contains data ({} departments, {} questions). Skipping automatic seed.",
                    departmentRepository.count(), questionRepository.count());
        }
    }

    @Transactional
    public void seedData() {
        // 1. Departments (Khoa)
        Department deptBC = departmentRepository.save(Department.builder()
                .name("Khoa Binh chủng")
                .code("BC")
                .description("Khoa Binh chủng - Trường Quân sự Quân khu 3")
                .isActive(true)
                .build());

        Department deptCT = departmentRepository.save(Department.builder()
                .name("Khoa Chiến thuật")
                .code("CT")
                .description("Khoa Chiến thuật")
                .isActive(true)
                .build());

        Department deptQSC = departmentRepository.save(Department.builder()
                .name("Khoa Quân sự chung")
                .code("QSC")
                .description("Khoa Quân sự chung")
                .isActive(true)
                .build());

        // 2. Department Groups (Tổ bộ môn)
        DepartmentGroup groupCB = departmentGroupRepository.save(DepartmentGroup.builder()
                .name("Tổ Bộ môn Công binh")
                .code("CB")
                .department(deptBC)
                .description("Tổ Bộ môn Công binh")
                .isActive(true)
                .build());

        DepartmentGroup groupTT = departmentGroupRepository.save(DepartmentGroup.builder()
                .name("Tổ Bộ môn Thông tin")
                .code("TT")
                .department(deptBC)
                .description("Tổ Bộ môn Thông tin")
                .isActive(true)
                .build());

        DepartmentGroup groupTS = departmentGroupRepository.save(DepartmentGroup.builder()
                .name("Tổ Bộ môn Trinh sát")
                .code("TS")
                .department(deptBC)
                .description("Tổ Bộ môn Trinh sát")
                .isActive(true)
                .build());

        DepartmentGroup groupCTBC = departmentGroupRepository.save(DepartmentGroup.builder()
                .name("Tổ Bộ môn Chiến thuật BB")
                .code("CTBB")
                .department(deptCT)
                .description("Tổ Bộ môn Chiến thuật Binh bộ")
                .isActive(true)
                .build());

        // 3. Subjects (Môn học)
        Subject subKTCB = subjectRepository.save(Subject.builder()
                .subjectName("Kỹ thuật Công binh")
                .subjectCode("KTCB")
                .departmentGroup(groupCB)
                .description("Môn học Kỹ thuật Công binh")
                .build());

        Subject subCTCB = subjectRepository.save(Subject.builder()
                .subjectName("Chiến thuật Công binh")
                .subjectCode("CTCB")
                .departmentGroup(groupCB)
                .description("Môn học Chiến thuật Công binh")
                .build());

        Subject subVCN = subjectRepository.save(Subject.builder()
                .subjectName("Vật cản nổ")
                .subjectCode("VCN")
                .departmentGroup(groupCB)
                .description("Môn học Vật cản nổ")
                .build());

        Subject subKTTT = subjectRepository.save(Subject.builder()
                .subjectName("Kỹ thuật Thông tin")
                .subjectCode("KTTT")
                .departmentGroup(groupTT)
                .description("Môn học Kỹ thuật Thông tin liên lạc")
                .build());

        // 4. Courses (Đối tượng thi)
        Course courseTDT = courseRepository.save(Course.builder()
                .name("Đào tạo Tiểu đội trưởng Công binh")
                .courseCode("TDT-CB")
                .description("Đối tượng đào tạo Tiểu đội trưởng Công binh c10/d4")
                .isActive(true)
                .build());

        Course courseKDT = courseRepository.save(Course.builder()
                .name("Đào tạo Khẩu đội trưởng")
                .courseCode("KDT")
                .description("Đối tượng đào tạo Khẩu đội trưởng")
                .isActive(true)
                .build());

        Course courseNV = courseRepository.save(Course.builder()
                .name("Đào tạo Nhân viên CMKT")
                .courseCode("NV-CMKT")
                .description("Đối tượng đào tạo Nhân viên chuyên môn kỹ thuật")
                .isActive(true)
                .build());

        Course courseSQDB = courseRepository.save(Course.builder()
                .name("Đào tạo Sĩ quan dự bị")
                .courseCode("SQDB")
                .description("Đối tượng đào tạo Sĩ quan dự bị")
                .isActive(true)
                .build());

        Set<Course> courseSetTDT = new HashSet<>(Collections.singletonList(courseTDT));
        Set<Course> courseSetAll = new HashSet<>(Arrays.asList(courseTDT, courseKDT, courseNV, courseSQDB));

        // 5. Questions for Kỹ thuật Công binh (52 questions across 4 types)
        List<Question> questionsToSave = new ArrayList<>();

        // --- A. LÝ THUYẾT (16 questions) ---
        String[][] theoryData = {
                {"Đồng chí trình bày yêu cầu khi mở cửa qua bãi vật cản trước tiền duyên phòng ngự của địch?",
                        "a. Yêu cầu chung:\n- Giữ vững bí mật, bất ngờ tuyệt đối.\n- Thực hiện đúng thứ tự, quy trình kỹ thuật.\n- Đảm bảo an toàn cho lực lượng và trang bị.\nb. Nguyên tắc hành động:\n- Kết hợp chặt chẽ giữa hỏa lực và xung lực.\n- Khắc phục nhanh, mở cửa triệt để theo đúng hướng quy định.", "4.0"},
                {"Đồng chí cho biết có bao nhiêu quy tắc an toàn khi bố trí mìn, trình bày quy tắc 1, 2, 3, 4, 5?",
                        "Có 10 quy tắc an toàn khi bố trí mìn:\n1. Nắm chắc cấu tạo, nguyên lý nổ của mìn và ngòi nổ.\n2. Phải kiểm tra tình trạng kỹ thuật trước khi mang ra bãi mìn.\n3. Chỉ được mở bảo hiểm sau khi đã chôn xong mìn và ngụy trang hoàn tất.\n4. Nghiêm cấm đặt mìn khi trời mưa bão sấm sét lớn.\n5. Không được mang thuốc lá, bật lửa hoặc vật phát tia lửa vào khu vực bố trí.", "4.0"},
                {"Đồng chí nêu khái niệm, nội dung trạng thái sẵn sàng chiến đấu thường xuyên?",
                        "- Khái niệm: Là trạng thái đơn vị duy trì các hoạt động thường xuyên, sẵn sàng đối phó thắng lợi với các tình huống đột xuất.\n- Nội dung:\n+ Quân số, vũ khí trang bị đạt tỷ lệ theo quy định.\n+ Duy trì nghiêm các chế độ trực ban, trực chỉ huy, trực tác chiến.\n+ Hệ thống thông tin liên lạc thông suốt 24/24.", "4.0"},
                {"Đồng chí nêu yêu cầu khi bố trí vật cản?",
                        "1. Phù hợp với ý định tác chiến của người chỉ huy.\n2. Kết hợp chặt chẽ giữa vật cản nổ và vật cản không nổ.\n3. Đặt vật cản phải kết hợp chặt chẽ với hệ thống hỏa lực bắn chặn.\n4. Giữ vững bí mật, nghi binh đánh lừa địch.\n5. Đảm bảo thuận tiện cho việc cơ động và phòng ngừa thương vong cho quân ta.", "4.0"},
                {"Đồng chí hãy nêu khái niệm, nội dung trạng thái sẵn sàng chiến đấu toàn bộ?",
                        "- Khái niệm: Là trạng thái chuyển toàn bộ lực lượng, vũ khí trang bị và cơ sở vật chất sẵn sàng bước vào chiến đấu trực tiếp.\n- Nội dung:\n+ Cơ động toàn bộ ra khu vực sơ tán, tập kết bí mật.\n+ Cấp phát đầy đủ đạn dược, cơ số thuốc men và lương thực chiến đấu.\n+ Sẵn sàng nổ súng đánh địch theo phương án tác chiến.", "4.0"},
                {"Đồng chí nêu tổ chức biên chế, nhiệm vụ, trang bị của aCB mở cửa mở cho xe tăng?",
                        "- Tổ chức biên chế: Tiểu đội gồm 9 đồng chí (Tiểu đội trưởng và 8 chiến sĩ chia làm 3 tổ).\n- Nhiệm vụ: Dò gỡ mìn, phá rào bùng nhùng, mở đường vượt qua hào chống tăng cho xe tăng cơ động.\n- Trang bị: Máy dò mìn, bộc phá ống, lượng nổ dài, kéo cắt rào, cọc dấu phản quang.", "4.0"},
                {"Đồng chí cho biết có bao nhiêu quy tắc an toàn khi làm công tác phá nổ, trình bày quy tắc 1, 2, 3, 4?",
                        "Có 8 quy tắc an toàn khi làm công tác phá nổ:\n1. Kiểm tra kỹ chất lượng thuốc nổ, kíp nổ và dây cháy chậm trước khi tra lắp.\n2. Chỉ người chỉ huy hoặc người được phân công trực tiếp mới được phép phát lệnh tra nụ xòe hoặc châm lửa.\n3. Khoảng cách an toàn và hầm ẩn nấp phải được chuẩn bị chu đáo trước khi phát hỏa.\n4. Sau khi nổ, phải đợi ít nhất 15 phút mới được ra kiểm tra hiện trường.", "4.0"},
                {"Đồng chí cho biết có bao nhiêu quy tắc an toàn khi phá đất, đá; trình bày quy tắc 1, 2, 3, 4?",
                        "1. Tính toán lượng nổ chính xác theo hệ số đất đá để tránh đá văng quá xa.\n2. Bố trí người cảnh giới phong tỏa các hướng cơ động vào bãi nổ trong bán kính nguy hiểm.\n3. Sử dụng tín hiệu còi, cờ thống nhất theo quy định quân sự.\n4. Che chắn kỹ miệng lỗ mìn bằng bao cát hoặc lưới chắn đá văng.", "4.0"},
                {"Đồng chí trình bày nguyên lý vận chuyển nổ của mìn chống bộ binh K-58?",
                        "- Cấu tạo: Thân mìn bằng nhựa tổng hợp, chứa thuốc nổ mạnh, ngòi nổ cơ học gắn lò xo đè nổ.\n- Nguyên lý hoạt động: Khi người giẫm lên nắp mìn với lực đè từ 5 - 15kg, chốt giữ lò xo bị đẩy trượt, giải phóng kim hỏa đâm mạnh vào hạt lửa, kích nổ kíp và gây nổ khối thuốc chính.", "4.0"},
                {"Đồng chí nêu các bộ phận chính của đường quân sự?",
                        "- Nền đường: Đào hoặc đắp tạo mặt phẳng ổn định chịu tải.\n- Mặt đường: Lớp chịu lực trực tiếp từ xe pháo hành quân.\n- Hệ thống thoát nước: Rãnh dọc, rãnh ngang, cống ngầm thoát nước mưa.\n- Công trình vượt chướng ngại: Ngầm, cầu quân sự, phà.", "4.0"},
                {"Đồng chí nêu nguyên lý vận chuyển của mìn chống tăng TM-62M?",
                        "- Thân mìn bằng kim loại chứa 7,5kg thuốc nổ TNT hoặc hỗn hợp MS.\n- Sử dụng ngòi nổ áp lực MVCh-62 có chốt hãm chậm bằng đồng hồ hẹn giờ.\n- Lực đè nổ từ 200kg đến 500kg, bánh xe hoặc xích xe tăng đè lên sẽ kích nổ ngòi phá vỡ xích hoặc đáy xe.", "4.0"},
                {"Đồng chí trình bày khái niệm và yêu cầu của công sự ẩn nấp?",
                        "- Khái niệm: Là công trình công binh bảo vệ bộ đội và vũ khí trang bị khỏi bom đạn, mảnh pháo và vũ khí hủy diệt lớn.\n- Yêu cầu:\n+ Kiên cố, vững chắc, chịu được áp lực sóng xung kích.\n+ Dễ ngụy trang bí mật, chống trinh sát hồng ngoại và quang học.\n+ Thuận tiện cơ động ra vào trận địa chiến đấu.", "4.0"},
                {"Đồng chí nêu tác dụng và yêu cầu của công sự chiến đấu?",
                        "- Tác dụng: Tạo vị trí bắn thuận lợi, phát huy tối đa uy lực hỏa lực, đồng thời che chắn cho xạ thủ.\n- Yêu cầu: Đảm bảo góc bắn rộng, độ dốc công sự không trượt sạt, có rãnh thoát nước và hốc đạn dự phòng.", "4.0"},
                {"Đồng chí trình bày các bộ phận chính của đường vòng (Đ, T, TĐ, TC)?",
                        "- Đ: Điểm đổi hướng tuyến đường.\n- T: Tiếp tuyến đường cong.\n- TĐ: Điểm tiếp đầu (bắt đầu vào cung tròn).\n- TC: Điểm tiếp cuối (kết thúc cung tròn trở lại đường thẳng).", "4.0"},
                {"Đồng chí cho biết phân loại vật cản nổ và vật cản không nổ trong công binh?",
                        "- Vật cản nổ: Bãi mìn chống tăng, bãi mìn chống bộ binh, mìn vướng nổ, lượng nổ tập trung chôn sẵn.\n- Vật cản không nổ: Hào chống tăng, tường chống tăng, rào dây thép gai bùng nhùng, bẫy chông, bãi cọc chống đổ bộ.", "4.0"},
                {"Đồng chí nêu quy trình khắc phục bãi mìn bằng phương pháp thủ công?",
                        "Bước 1: Trinh sát xác định giới hạn bãi mìn và mật độ mìn.\nBước 2: Phóng lượng nổ mở luồng sơ bộ hoặc dùng máy dò mìn dò theo đường ziczac.\nBước 3: Đánh dấu vị trí mìn phát hiện bằng cọc tiêu phản quang.\nBước 4: Tiến hành tháo gỡ hoặc phá hủy mìn tại chỗ bằng thuốc nổ đè.", "4.0"}
        };

        for (int i = 0; i < theoryData.length; i++) {
            questionsToSave.add(Question.builder()
                    .code(String.format("CH-KTCB-LT-%03d", i + 1))
                    .content(theoryData[i][0])
                    .answer(theoryData[i][1])
                    .score(Double.parseDouble(theoryData[i][2]))
                    .type(QuestionType.LY_THUYET)
                    .difficultyLevel(DifficultyLevel.MEDIUM)
                    .subject(subKTCB)
                    .courses(courseSetTDT)
                    .isActive(true)
                    .build());
        }

        // --- B. THỰC HÀNH (16 questions) ---
        String[][] practiceData = {
                {"Đồng chí thực hành vừa nói vừa làm thứ tự các bước bố trí mìn chống bộ binh K-58?",
                        "Bước 1: Chuẩn bị hố đặt mìn đúng kích thước (đường kính 12cm, sâu 8cm).\nBước 2: Đặt mìn vào hố, kiểm tra độ cân bằng của đáy mìn.\nBước 3: Rút chốt an toàn cẩn thận, không làm rung lắc nắp mìn.\nBước 4: Ngụy trang mặt mìn bằng cỏ khô hoặc đất mịn, độ dày không quá 2cm.", "5.0"},
                {"Đồng chí thực hành nói và làm thứ tự các bước khi tháo gỡ mìn chống bộ binh K-58?",
                        "Bước 1: Nhẹ nhàng bóc lớp đất ngụy trang xung quanh nắp mìn.\nBước 2: Cắm chốt an toàn dự phòng vào lỗ khóa kíp.\nBước 3: Nâng mìn nhẹ nhàng ra khỏi hố, lau chùi đất cát.\nBước 4: Tháo cụm ngòi nổ ra khỏi thân mìn và cất vào hộp chuyên dụng.", "5.0"},
                {"Đồng chí thực hành vừa nói vừa làm động tác gói buộc lượng nổ dài bằng thuốc bánh loại 400g (không vỏ bọc) trọng lượng 4 kg?",
                        "Bước 1: Xếp 10 bánh thuốc 400g thành hàng dọc so le trên nẹp gỗ.\nBước 2: Dùng dây dù hoặc băng dính quân sự quấn chặt từng mắt thuốc.\nBước 3: Đặt dây nổ dọc thân lượng nổ để tăng tốc độ truyền nổ.\nBước 4: Tra kíp số 8 vào bánh thuốc đầu và quấn bảo hiểm chống tuột.", "5.0"},
                {"Đồng chí thực hành vừa nói vừa làm thứ tự các bước bố trí mìn chống tăng TM-57?",
                        "Bước 1: Đào hố mìn đường kính 35cm, sâu 15cm.\nBước 2: Đặt mìn vào hố thăng bằng.\nBước 3: Lắp ngòi nổ MV-57 vào miệng ren trên nắp mìn, xoay chặt vừa tay.\nBước 4: Bấm nút mở khóa bảo hiểm, phủ đất ngụy trang bằng phẳng với mặt đất.", "5.0"},
                {"Đồng chí thực hành vừa nói vừa làm thứ tự các bước tháo gỡ mìn chống bộ binh POMZ-2?",
                        "Bước 1: Dò tìm dây vướng nổ, neo cố định dây chống co giật.\nBước 2: Dùng dây thép cắm chốt an toàn qua lỗ kim hỏa trên ngòi nổ MUV.\nBước 3: Cắt đứt dây vướng nổ về phía cọc neo.\nBước 4: Tháo ngòi nổ ra khỏi thân gang mìn dứa POMZ-2.", "5.0"},
                {"Đồng chí thực hành vừa nói vừa làm thứ tự các bước bố trí mìn chống bộ binh POMZ-2?",
                        "Bước 1: Đóng cọc gỗ định vị chắc chắn xuống đất.\nBước 2: Lắp bánh thuốc 75g vào cọc, trùm thân gang POMZ-2 lên trên.\nBước 3: Đóng cọc néo và kéo dây vướng nổ căng vừa phải ở độ cao 15cm.\nBước 4: Lắp ngòi nổ MUV, móc dây vướng vào chốt nổ rồi rút chốt an toàn.", "5.0"},
                {"Đồng chí trên cương vị tiểu đội trưởng Công binh phổ biến kế hoạch luyện tập cho tiểu đội nội dung aCB xây dựng công sự?",
                        "1. Tập trung tiểu đội, điểm danh quân số, kiểm tra trang bị cuốc xẻng.\n2. Phổ biến mục đích, yêu cầu bài tập và phân chia vị trí đào cho từng tổ.\n3. Nhắc nhở quy tắc an toàn và quy định giữ bí mật tiếng động, ánh sáng.\n4. Phát lệnh cho các tổ vào vị trí phác họa và đào đất theo tiêu chuẩn kỹ thuật.", "5.0"},
                {"Đồng chí thực hành vừa nói vừa làm động tác chắp nối bộ đồ dùng gây nổ thường?",
                        "Bước 1: Dùng dao bấm cắt vát đầu dây cháy chậm 45 độ phẳng mép.\nBước 2: Kiểm tra kíp nổ số 8 sạch sẽ, không có đất cát bên trong.\nBước 3: Đút nhẹ nhàng đầu dây cháy chậm vào kíp nổ cho tới khi chạm đáy hạt thuốc.\nBước 4: Dùng kìm bóp kíp kẹp chặt miệng kíp vào vỏ dây cháy chậm chống tuột nước.", "5.0"},
                {"Đồng chí thực hành vừa nói vừa làm động tác bố trí mìn chống tăng TM-62M?",
                        "Bước 1: Đào hố mìn sâu 20cm, đáy phẳng lót cát mềm.\nBước 2: Mở nắp bảo vệ ngòi, vặn ngòi nổ MVCh-62 vào thân mìn.\nBước 3: Nhấn nút hẹn giờ khởi động ngòi nổ.\nBước 4: Lấp đất và ngụy trang kỹ mặt cỏ trả lại hiện trạng tự nhiên.", "5.0"},
                {"Đồng chí thực hành vừa nói vừa làm động tác gói buộc lượng nổ tập trung bằng thuốc bánh loại 400g (không có vỏ bọc), trọng lượng 6,4 kg?",
                        "Bước 1: Xếp 16 bánh thuốc 400g thành khối hình hộp chữ nhật (4x4 hoặc 4x2x2).\nBước 2: Dùng nẹp tre hoặc dây dù buộc thắt nút chữ thập quanh khối thuốc.\nBước 3: Chừa lỗ tra kíp ở giữa khối thuốc để đảm bảo nổ hoàn toàn.\nBước 4: Làm quai xách chắc chắn bằng dây vải quân trang.", "5.0"},
                {"Đồng chí thực hành vừa nói vừa làm thứ tự các bước khi tháo gỡ mìn chống tăng TM-57?",
                        "Bước 1: Quét sạch đất cát trên bề mặt nắp mìn.\nBước 2: Cài chốt an toàn trở lại vị trí khóa ngòi nổ.\nBước 3: Dùng cờ-lê chuyên dụng vặn ngược chiều kim đồng hồ tháo cụm ngòi nổ ra.\nBước 4: Nhấc thân mìn ra khỏi hố, thu dọn hiện trường.", "5.0"},
                {"Đồng chí thực hành vừa nói vừa làm động tác gây nổ lượng nổ bằng nụ xòe?",
                        "Bước 1: Cắt vuông góc đầu dây cháy chậm của lượng nổ.\nBước 2: Đút đầu dây cháy chậm vào đuôi nụ xòe, dùng kìm kẹp chặt mép ống.\nBước 3: Tay trái giữ chắc thân nụ xòe, tay phải giật mạnh dây giật nụ xòe theo hướng trục.\nBước 4: Quan sát khói xì ra từ đầu dây cháy chậm rồi nhanh chóng cơ động về hầm ẩn nấp.", "5.0"},
                {"Đồng chí thực hành vừa nói vừa làm động tác phác họa, đào công sự nằm bắn của súng tiểu liên AK (đào bằng xẻng)?",
                        "Bước 1: Nằm sấp áp sát mặt đất, súng đặt bên phải thân người hướng về phía địch.\nBước 2: Dùng lưỡi xẻng vạch đường bao công sự hình chữ nhật dài 1,8m, rộng 0,6m.\nBước 3: Đào hốc đặt súng và phần đầu sâu 20cm, hất đất đắp thành bờ chắn cao 15cm trước mặt.\nBước 4: Đào dần về phía sau tạo độ dốc thoai thoải vừa thân người nằm bắn.", "5.0"},
                {"Đồng chí thực hành vừa nói vừa làm động tác phác họa, đào công sự nằm bắn của súng tiểu liên AK (đào bằng cuốc)?",
                        "Bước 1: Xác định hướng bắn chủ yếu và hướng bắn phụ.\nBước 2: Dùng cuốc chim nhỏ phác họa viền công sự và bờ chắn đạn.\nBước 3: Cuốc tơi đất, dùng xẻng hoặc tay vun đất làm bờ chắn dày ít nhất 30cm.\nBước 4: Ngụy trang bờ đắp bằng cỏ xanh cùng màu với địa hình xung quanh.", "5.0"},
                {"Đồng chí trên cương vị tổ trưởng chỉ huy tổ Công binh đo độ dốc bằng thước 3m và thuỷ bình (A - B)?",
                        "Bước 1: Đặt chân thước 3m tại điểm mốc A, kéo thẳng về phía điểm B.\nBước 2: Đặt thước thủy bình lên giữa sống thước 3m.\nBước 3: Điều chỉnh đầu thước B nâng lên hạ xuống cho bọt thủy nằm chính giữa vạch chuẩn.\nBước 4: Dùng thước lá đo khoảng cách chênh cao h từ đáy thước đến mặt đất, tính độ dốc i = h/3.", "5.0"},
                {"Đồng chí thực hành vừa nói vừa làm động tác kiểm tra và sử dụng máy dò mìn bán dẫn?",
                        "Bước 1: Lắp pin vào máy, bật công tắc nguồn và đeo tai nghe kiểm tra âm thanh chuẩn.\nBước 2: Cầm cần dò đưa khung dò quét ngang mặt đất cách 5 - 10cm với tốc độ 0,5m/s.\nBước 3: Khi nghe tiếng rú tăng đột ngột trong tai nghe, dừng lại quét chữ thập xác định tâm tín hiệu.\nBước 4: Dùng que thăm mìn chọc nghiêng 30 độ để xác định chính xác vỏ quả mìn.", "5.0"}
        };

        for (int i = 0; i < practiceData.length; i++) {
            questionsToSave.add(Question.builder()
                    .code(String.format("CH-KTCB-TH-%03d", i + 1))
                    .content(practiceData[i][0])
                    .answer(practiceData[i][1])
                    .score(Double.parseDouble(practiceData[i][2]))
                    .type(QuestionType.THUC_HANH)
                    .difficultyLevel(DifficultyLevel.HARD)
                    .subject(subKTCB)
                    .courses(courseSetTDT)
                    .isActive(true)
                    .build());
        }

        // --- C. TỰ LUẬN (10 questions) ---
        String[][] essayData = {
                {"Phân tích vai trò của bảo đảm công binh trong chiến dịch tiến công khu vực địa hình đồng bằng, sông nước?",
                        "1. Đặc điểm địa hình đồng bằng sông nước: Nhiều sông ngòi, kênh rạch chia cắt, nền đất yếu.\n2. Các nhiệm vụ trọng tâm của công binh:\n- Mở đường cơ động và bảo đảm cầu ngầm, bến phà vượt sông cho xe tăng, pháo binh.\n- Phá dỡ vật cản chốt chặn của địch ở các đầu mối giao thông huyết mạch.\n- Bố trí vật cản bảo vệ sườn và phía sau đội hình tiến công.\n3. Kết luận: Công binh là lực lượng nòng cốt bảo đảm tính cơ động và tốc độ tác chiến của chiến dịch.", "10.0"},
                {"Trình bày các biện pháp phòng chống vũ khí hủy diệt lớn cho công sự trận địa phòng ngự cấp phân đội?",
                        "1. Biện pháp kết cấu công sự: Xây dựng hầm chữ A, hầm kèo có lớp đất phủ dày từ 1m trở lên chống xuyên nổ.\n2. Hệ thống bịt kín và lọc độc: Lắp cửa kín khí, cửa chống áp lực sóng xung kích và ống lọc không khí.\n3. Tiêu tẩy độc hại: Chuẩn bị hố tiêu độc trước cửa hầm, bình xịt hóa chất khử trùng.\n4. Kỷ luật sinh hoạt: Duy trì báo động mặt nạ phòng độc khi có cảnh báo tác nhân hạt nhân, hóa học.", "10.0"},
                {"Phân tích nguyên tắc sử dụng lực lượng công binh trong khắc phục vật cản mở cửa mở mở rộng?",
                        "1. Nguyên tắc bí mật, bất ngờ: Sử dụng đêm tối, thời tiết xấu để tiếp cận bãi vật cản.\n2. Nguyên tắc tập trung hỏa lực chi viện: Hiệp đồng chặt chẽ với súng cối, pháo binh dập tắt hỏa điểm địch quanh cửa mở.\n3. Nguyên tắc mở cửa triệt để: Đảm bảo chiều rộng cửa mở tối thiểu 6 - 8m cho bộ binh và xe cơ giới cơ động an toàn.\n4. Đánh dấu và duy trì cửa mở thông suốt trong suốt quá trình phát triển chiến đấu.", "10.0"},
                {"So sánh tính năng kỹ chiến thuật và cách bố trí mìn chống tăng TM-57 và TM-62M?",
                        "- TM-57: Vỏ thép, nặng 9kg, chứa 6,5kg thuốc nổ, ngòi nổ MV-57 áp lực cơ học đơn giản, dễ bị máy dò mìn phát hiện.\n- TM-62M: Vỏ kim loại hoặc nhựa tổng hợp, chứa 7,5kg thuốc nổ uy lực lớn hơn, ngòi nổ MVCh-62 có hẹn giờ chống kích nổ sớm.\n- Cách bố trí: TM-62M chịu được áp lực nổ gần tốt hơn, thích hợp bố trí trong đội hình bãi mìn dày đặc.", "10.0"},
                {"Trình bày phương pháp tính toán lượng thuốc nổ cần thiết để phá hủy mố cầu bê tông cốt thép?",
                        "1. Công thức tính lượng nổ phá hoại: Q = A * V (hoặc Q = K * R^3 * f).\n2. Xác định các tham số:\n- A: Hệ số tính năng của bê tông cốt thép.\n- V: Thể tích cấu kiện cần phá hủy.\n- R: Bán kính phá hoại tối thiểu.\n3. Bố trí lượng nổ: Chia nhỏ thành các lỗ mìn khoan sâu 2/3 bề dày mố cầu để tăng hiệu suất kích nổ.", "10.0"},
                {"Phân tích yêu cầu ngụy trang công sự trận địa pháo binh cấp tiểu đoàn?",
                        "1. Mô phỏng đúng màu sắc, kết cấu của thảm thực vật xung quanh.\n2. Xóa sạch mọi dấu vết bánh xích, lối đi cơ động sau khi hoàn thành.\n3. Sử dụng lưới ngụy trang chống trinh sát quang học và hồng ngoại.\n4. Bố trí trận địa pháo giả để nghi binh thu hút hỏa lực phản kích của địch.", "10.0"},
                {"Trình bày các bước lập kế hoạch bảo đảm công binh cho phân đội bộ binh phòng ngự?",
                        "Bước 1: Nghiên cứu nhiệm vụ, địa hình, tình hình địch và khả năng lực lượng công binh phối thuộc.\nBước 2: Dự kiến các khu vực công sự then chốt và các hướng bãi mìn ngăn chặn.\nBước 3: Phân chia quân số, máy móc, vật liệu và thời gian hoàn thành từng hạng mục.\nBước 4: Báo cáo chỉ huy cấp trên và hiệp đồng cụ thể với các đơn vị bộ binh phòng ngự.", "10.0"},
                {"Phân tích nguyên lý và ứng dụng của bộc phá ống trong tác chiến công binh?",
                        "1. Cấu tạo: Ống thép chứa thuốc nổ dẻo hoặc thuốc bánh nối tiếp nhau.\n2. Nguyên lý nổ: Kích nổ từ một đầu, sóng nổ lan truyền cực nhanh dọc thân ống tạo luồng khí phá cắt phẳng.\n3. Ứng dụng: Phá rào thép gai nhiều tầng, phá bãi mìn cọc vướng nổ, mở đường cho mũi nhọn đột phá.", "10.0"},
                {"Trình bày nhiệm vụ của phân đội công binh trong phòng chống thiên tai, cứu hộ cứu nạn?",
                        "1. Sẵn sàng lực lượng, phương tiện ca-nô, phà chở bộ đội sơ tán nhân dân vùng ngập lụt.\n2. Gia cố đê kè sạt lở bằng rọ đá, bao cát cọc tre.\n3. Cứu hộ sập đổ công trình, mở đường thông tuyến giao thông huyết mạch.\n4. Rà phá vật nổ lộ thiên trôi dạt sau mưa lũ.", "10.0"},
                {"Phân tích biện pháp kỹ thuật chống sạt lở hào chiến đấu trong mùa mưa lũ?",
                        "1. Làm vách kè bằng phên tre, cọc gỗ hoặc bao cát bậc thang.\n2. Đào rãnh thoát nước dọc đáy hào có độ dốc từ 1 - 2% dẫn về hố thu nước.\n3. Vát taluy vách hào đúng góc nghiêng tự nhiên của chất đất.\n4. Phủ bạt nylon hoặc trồng cỏ chống xói mòn trên mặt bờ đắp.", "10.0"}
        };

        for (int i = 0; i < essayData.length; i++) {
            questionsToSave.add(Question.builder()
                    .code(String.format("CH-KTCB-TL-%03d", i + 1))
                    .content(essayData[i][0])
                    .answer(essayData[i][1])
                    .score(Double.parseDouble(essayData[i][2]))
                    .type(QuestionType.TU_LUAN)
                    .difficultyLevel(DifficultyLevel.HARD)
                    .subject(subKTCB)
                    .courses(courseSetTDT)
                    .isActive(true)
                    .build());
        }

        // --- D. TÌNH HUỐNG (10 questions) ---
        String[][] situationData = {
                {"Khi tiểu đội công binh đang mở cửa mở bằng lượng nổ dài thì địch phát hiện bắn pháo cấp tập, đồng chí xử trí thế nào trên cương vị tiểu đội trưởng?",
                        "1. Lệnh cho tiểu đội nhanh chóng ẩn nấp vào các hố bom, khe rãnh sẵn có, bảo vệ lượng nổ.\n2. Báo cáo ngay về chỉ huy đại đội xin hỏa lực chế áp các trận địa cối địch.\n3. Khi pháo địch vừa chuyển làn, lập tức đôn đốc các tổ cơ động đẩy bộc phá ống lên phía trước.\n4. Quyết đoán phát hỏa đúng thời cơ mở thông cửa mở cho bộ binh xung phong.", "10.0"},
                {"Trong quá trình dò tìm mìn, phát hiện mìn bẫy có gắn ngòi nổ chống tháo gỡ, đồng chí tổ chức xử trí ra sao?",
                        "1. Lập tức ra lệnh cho chiến sĩ dừng thao tác, đánh dấu vị trí nguy hiểm bằng cờ đỏ.\n2. Cấm tuyệt đối hành động nâng kéo hoặc cắt bất kỳ dây nối nào quanh quả mìn.\n3. Bố trí một bánh thuốc nổ 200g đặt sát cạnh mìn bẫy, tra kíp điện hoặc dây cháy chậm dài.\n4. Đưa toàn bộ phân đội ra cự ly an toàn 100m và tiến hành kích nổ hủy mìn tại chỗ.", "10.0"},
                {"Khi phát lệnh gây nổ lượng nổ phá vật cản nhưng kíp nổ không cháy (nổ xịt), đồng chí xử trí như thế nào theo đúng quy tắc an toàn?",
                        "1. Ra lệnh toàn tiểu đội giữ nguyên vị trí ẩn nấp, tuyệt đối không ai được di chuyển.\n2. Chờ đủ thời gian an toàn theo quy chế (tối thiểu 15 phút với dây cháy chậm thường).\n3. Một mình tiểu đội trưởng hoặc thợ nổ chính tiếp cận kiểm tra cẩn thận.\n4. Đặt một khối thuốc mới có kíp tốt áp sát khối thuốc cũ để kích nổ lại.", "10.0"},
                {"Đơn vị được lệnh hành quân vượt sông bí mật ban đêm nhưng bến vượt dự kiến bị địch thả mìn trôi, phương án xử lý của đồng chí là gì?",
                        "1. Bố trí tổ trinh sát công binh dùng đèn hồng ngoại quan sát mật độ mìn trôi trên mặt nước.\n2. Thả phao tiêu cản dòng hoặc lưới đánh chặn phía thượng lưu bến vượt.\n3. Dùng súng bắn tỉa gắn giảm thanh bắn kích nổ từ xa các quả mìn trôi tiếp cận.\n4. Chuyển hướng bến vượt phụ cách bến chính 500m để đảm bảo an toàn bí mật cho đội hình.", "10.0"},
                {"Trong quá trình đào công sự cho pháo binh, phát hiện bom chưa nổ nằm ở độ sâu 1,5m, đồng chí chỉ huy đơn vị xử trí tình huống này thế nào?",
                        "1. Phát lệnh dừng ngay việc đào bới bằng cuốc xẻng tại vị trí phát hiện.\n2. Đánh dấu vành đai nguy hiểm bán kính 50m, cấm người và phương tiện qua lại.\n3. Dùng chổi lông mềm gạt nhẹ đất lộ thiên phần đuôi bom để xác định chủng loại và ngòi nổ.\n4. Báo cáo khẩn cấp về Ban Công binh trung đoàn cử lực lượng chuyên trách rà phá bom mìn xử lý.", "10.0"},
                {"Đoàn xe vận tải quân sự bị ùn tắc do đoạn đường ngầm qua suối bị lũ cuốn sạt lở, tiểu đội của đồng chí được giao khắc phục khẩn cấp trong 2 giờ, đồng chí tổ chức ra sao?",
                        "1. Cắt cử 2 chiến sĩ cảnh giới lũ ống đầu nguồn suối bằng còi tín hiệu.\n2. Huy động lực lượng chặt cây gỗ tròn, kết thành phên lót đáy ngầm bùn lầy.\n3. Dùng bao tải đất đá đắp chèn 2 bên mép ngầm chống trượt xe.\n4. Cắm cọc tiêu đánh dấu mực nước ngập cho phép và chỉ huy từng xe qua ngầm an toàn.", "10.0"},
                {"Đang đêm thi công đường hầm bí mật thì xảy ra hiện tượng sụt lún nóc hầm đè kẹt 1 chiến sĩ, phương án cứu hộ của đồng chí là gì?",
                        "1. Lệnh tắt toàn bộ máy nổ rung lắc, giữ yên tĩnh để quan sát cấu trúc vòm hầm sụt.\n2. Dùng kích thủy lực và gỗ chống tạm thời chống đỡ các điểm có nguy cơ sập tiếp.\n3. Dùng tay và xẻng nhỏ đào bới nhẹ nhàng quanh vị trí chiến sĩ bị nạn, cung cấp oxy thở ngay lập tức.\n4. Đưa chiến sĩ ra cáng cứu thương an toàn rồi tiến hành gia cố vòm hầm kiên cố.", "10.0"},
                {"Phát hiện trinh sát cơ giới địch đang tiến vào bãi mìn của ta nhưng bãi mìn chưa kịp rút chốt an toàn, đồng chí xử trí thế nào?",
                        "1. Không cho bộ đội mạo hiểm lao ra bãi mìn trước mũi súng địch.\n2. Phối hợp với tổ hỏa lực đại đội dùng súng chống tăng B41 bắn tiêu diệt xe đi đầu của địch.\n3. Sử dụng hệ thống mìn định hướng DH-10 điều khiển bằng điện kích nổ từ xa để bẻ gãy mũi tiến công.\n4. Đợi thời cơ địch rút lui hoặc chuyển hướng mới tiếp tục hoàn thiện bãi mìn.", "10.0"},
                {"Máy dò mìn bị sét đánh hỏng nguồn điện trong khi nhiệm vụ mở cửa mở khẩn cấp còn 30 phút, đồng chí khắc phục ra sao?",
                        "1. Nhanh chóng chuyển sang phương pháp dò mìn thủ công bằng que thăm mìn và dao găm.\n2. Đổi khoảng cách cắm que thăm 5cm một mũi với góc nghiêng chuẩn 30 độ.\n3. Tăng cường chiến sĩ cảnh giới hỏa lực hỗ trợ cho tổ dò thủ công.\n4. Kết hợp bộc phá ống quét dọn nhanh các lớp rào thép gai bên ngoài.", "10.0"},
                {"Khi hoàn thành bãi mìn, chiến sĩ làm rơi sơ đồ bãi mìn tại khu vực nghi có thám báo địch, đồng chí xử trí ra sao?",
                        "1. Khẩn trương tổ chức tìm kiếm tại khu vực làm rơi trong vòng 10 phút.\n2. Nếu không tìm thấy, coi như sơ đồ đã bị lộ lọt vào tay địch.\n3. Lập tức báo cáo chỉ huy điều chỉnh thay đổi các hướng tuyến mìn then chốt.\n4. Cài bổ sung mìn bẫy chống tháo gỡ tại các lối mòn nghi ngờ địch xâm nhập theo sơ đồ cũ.", "10.0"}
        };

        for (int i = 0; i < situationData.length; i++) {
            questionsToSave.add(Question.builder()
                    .code(String.format("CH-KTCB-THU-%03d", i + 1))
                    .content(situationData[i][0])
                    .answer(situationData[i][1])
                    .score(Double.parseDouble(situationData[i][2]))
                    .type(QuestionType.TINH_HUONG)
                    .difficultyLevel(DifficultyLevel.HARD)
                    .subject(subKTCB)
                    .courses(courseSetTDT)
                    .isActive(true)
                    .build());
        }

        questionRepository.saveAll(questionsToSave);
        log.info("Saved {} questions for subject Kỹ thuật Công binh.", questionsToSave.size());

        // 6. Generate a ready-to-test sample Exam with 12 exam sets (N = 12)
        if (examRepository.count() == 0) {
            try {
                ExamRequest sampleRequest = new ExamRequest();
                sampleRequest.setTitle("ĐỀ THI TỐT NGHIỆP");
                sampleRequest.setSubjectId(subKTCB.getId());
                sampleRequest.setCourseId(courseTDT.getId());
                sampleRequest.setSemester("1");
                sampleRequest.setAcademicYear("2025");
                sampleRequest.setDurationMinutes(90);
                sampleRequest.setExamStructure(ExamStructureType.THEORY_PRACTICE);
                sampleRequest.setNumberOfExams(12);
                sampleRequest.setNumberOfTheories(1);
                sampleRequest.setNumberOfPractices(1);
                sampleRequest.setNumberOfEssays(0);
                sampleRequest.setNumberOfSituations(0);

                examGeneratorService.generateExam(sampleRequest);
                log.info("Successfully generated sample Exam batch with 12 exam sets for immediate testing!");
            } catch (Exception e) {
                log.error("Failed to generate sample exam batch: {}", e.getMessage(), e);
            }
        }
    }
}
