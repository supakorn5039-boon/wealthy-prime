import { PROVINCE_I18N } from './ProvinceNames'
import { DISTRICT_I18N } from './DistrictNames'

export const PROVINCES = [
  'กรุงเทพมหานคร',
  'กระบี่',
  'กาญจนบุรี',
  'กาฬสินธุ์',
  'กำแพงเพชร',
  'ขอนแก่น',
  'จันทบุรี',
  'ฉะเชิงเทรา',
  'ชลบุรี',
  'ชัยนาท',
  'ชัยภูมิ',
  'ชุมพร',
  'เชียงราย',
  'เชียงใหม่',
  'ตรัง',
  'ตราด',
  'ตาก',
  'นครนายก',
  'นครปฐม',
  'นครพนม',
  'นครราชสีมา',
  'นครศรีธรรมราช',
  'นครสวรรค์',
  'นนทบุรี',
  'นราธิวาส',
  'น่าน',
  'บึงกาฬ',
  'บุรีรัมย์',
  'ปทุมธานี',
  'ประจวบคีรีขันธ์',
  'ปราจีนบุรี',
  'ปัตตานี',
  'พระนครศรีอยุธยา',
  'พังงา',
  'พัทลุง',
  'พิจิตร',
  'พิษณุโลก',
  'เพชรบุรี',
  'เพชรบูรณ์',
  'แพร่',
  'พะเยา',
  'ภูเก็ต',
  'มหาสารคาม',
  'มุกดาหาร',
  'แม่ฮ่องสอน',
  'ยโสธร',
  'ยะลา',
  'ร้อยเอ็ด',
  'ระนอง',
  'ระยอง',
  'ราชบุรี',
  'ลพบุรี',
  'ลำปาง',
  'ลำพูน',
  'เลย',
  'ศรีสะเกษ',
  'สกลนคร',
  'สงขลา',
  'สตูล',
  'สมุทรปราการ',
  'สมุทรสงคราม',
  'สมุทรสาคร',
  'สระแก้ว',
  'สระบุรี',
  'สิงห์บุรี',
  'สุโขทัย',
  'สุพรรณบุรี',
  'สุราษฎร์ธานี',
  'สุรินทร์',
  'หนองคาย',
  'หนองบัวลำภู',
  'อ่างทอง',
  'อำนาจเจริญ',
  'อุดรธานี',
  'อุทัยธานี',
  'อุตรดิตถ์',
  'อุบลราชธานี',
] as const

export const DISTRICTS_BY_PROVINCE: Record<string, readonly string[]> = {
  กรุงเทพมหานคร: [
    'พระนคร', 'ดุสิต', 'หนองจอก', 'บางรัก', 'บางเขน', 'บางกะปิ', 'ปทุมวัน',
    'ป้อมปราบศัตรูพ่าย', 'พระโขนง', 'มีนบุรี', 'ลาดกระบัง', 'ยานนาวา', 'สัมพันธวงศ์',
    'พญาไท', 'ธนบุรี', 'บางกอกใหญ่', 'ห้วยขวาง', 'คลองสาน', 'ตลิ่งชัน', 'บางกอกน้อย',
    'บางขุนเทียน', 'ภาษีเจริญ', 'หนองแขม', 'ราษฎร์บูรณะ', 'บางพลัด', 'ดินแดง', 'บึงกุ่ม',
    'สาทร', 'บางซื่อ', 'จตุจักร', 'บางคอแหลม', 'ประเวศ', 'คลองเตย', 'สวนหลวง', 'จอมทอง',
    'ดอนเมือง', 'ราชเทวี', 'ลาดพร้าว', 'วัฒนา', 'บางแค', 'หลักสี่', 'สายไหม', 'คันนายาว',
    'สะพานสูง', 'วังทองหลาง', 'คลองสามวา', 'บางนา', 'ทวีวัฒนา', 'ทุ่งครุ', 'บางบอน',
  ],
  กระบี่: ['เมืองกระบี่', 'เขาพนม', 'เกาะลันตา', 'คลองท่อม', 'อ่าวลึก', 'ปลายพระยา', 'ลำทับ', 'เหนือคลอง'],
  กาญจนบุรี: ['เมืองกาญจนบุรี', 'ไทรโยค', 'บ่อพลอย', 'ศรีสวัสดิ์', 'ท่ามะกา', 'ท่าม่วง', 'ทองผาภูมิ', 'สังขละบุรี', 'พนมทวน', 'เลาขวัญ', 'ด่านมะขามเตี้ย', 'หนองปรือ', 'ห้วยกระเจา'],
  กาฬสินธุ์: ['เมืองกาฬสินธุ์', 'นามน', 'กมลาไสย', 'ร่องคำ', 'กุฉินารายณ์', 'เขาวง', 'ยางตลาด', 'ห้วยเม็ก', 'สหัสขันธ์', 'คำม่วง', 'ท่าคันโท', 'หนองกุงศรี', 'สมเด็จ', 'ห้วยผึ้ง', 'สามชัย', 'นาคู', 'ดอนจาน', 'ฆ้องชัย'],
  กำแพงเพชร: ['เมืองกำแพงเพชร', 'ไทรงาม', 'คลองลาน', 'ขาณุวรลักษบุรี', 'คลองขลุง', 'พรานกระต่าย', 'ลานกระบือ', 'ทรายทองวัฒนา', 'ปางศิลาทอง', 'บึงสามัคคี', 'โกสัมพีนคร'],
  ขอนแก่น: ['เมืองขอนแก่น', 'บ้านฝาง', 'พระยืน', 'หนองเรือ', 'ชุมแพ', 'สีชมพู', 'น้ำพอง', 'อุบลรัตน์', 'กระนวน', 'บ้านไผ่', 'เปือยน้อย', 'พล', 'แวงใหญ่', 'แวงน้อย', 'หนองสองห้อง', 'ภูเวียง', 'มัญจาคีรี', 'ชนบท', 'เขาสวนกวาง', 'ภูผาม่าน', 'ซำสูง', 'โคกโพธิ์ไชย', 'หนองนาคำ', 'บ้านแฮด', 'โนนศิลา', 'เวียงเก่า'],
  จันทบุรี: ['เมืองจันทบุรี', 'ขลุง', 'ท่าใหม่', 'โป่งน้ำร้อน', 'มะขาม', 'แหลมสิงห์', 'สอยดาว', 'แก่งหางแมว', 'นายายอาม', 'เขาคิชฌกูฏ'],
  ฉะเชิงเทรา: ['เมืองฉะเชิงเทรา', 'บางคล้า', 'บางน้ำเปรี้ยว', 'บางปะกง', 'บ้านโพธิ์', 'พนมสารคาม', 'ราชสาส์น', 'สนามชัยเขต', 'แปลงยาว', 'ท่าตะเกียบ', 'คลองเขื่อน'],
  ชลบุรี: ['เมืองชลบุรี', 'บ้านบึง', 'หนองใหญ่', 'บางละมุง', 'พานทอง', 'พนัสนิคม', 'ศรีราชา', 'เกาะสีชัง', 'สัตหีบ', 'บ่อทอง', 'เกาะจันทร์'],
  ชัยนาท: ['เมืองชัยนาท', 'มโนรมย์', 'วัดสิงห์', 'สรรพยา', 'สรรคบุรี', 'หันคา', 'หนองมะโมง', 'เนินขาม'],
  ชัยภูมิ: ['เมืองชัยภูมิ', 'บ้านเขว้า', 'คอนสวรรค์', 'เกษตรสมบูรณ์', 'หนองบัวแดง', 'จัตุรัส', 'บำเหน็จณรงค์', 'หนองบัวระเหว', 'เทพสถิต', 'ภูเขียว', 'บ้านแท่น', 'แก้งคร้อ', 'คอนสาร', 'ภักดีชุมพล', 'เนินสง่า', 'ซับใหญ่'],
  ชุมพร: ['เมืองชุมพร', 'ท่าแซะ', 'ปะทิว', 'หลังสวน', 'ละแม', 'พะโต๊ะ', 'สวี', 'ทุ่งตะโก'],
  เชียงราย: ['เมืองเชียงราย', 'เวียงชัย', 'เชียงของ', 'เทิง', 'พาน', 'ป่าแดด', 'แม่จัน', 'เชียงแสน', 'แม่สาย', 'แม่สรวย', 'เวียงป่าเป้า', 'พญาเม็งราย', 'เวียงแก่น', 'ขุนตาล', 'แม่ฟ้าหลวง', 'แม่ลาว', 'เวียงเชียงรุ้ง', 'ดอยหลวง'],
  เชียงใหม่: ['เมืองเชียงใหม่', 'จอมทอง', 'แม่แจ่ม', 'เชียงดาว', 'ดอยสะเก็ด', 'แม่แตง', 'แม่ริม', 'สะเมิง', 'ฝาง', 'แม่อาย', 'พร้าว', 'สันป่าตอง', 'สันกำแพง', 'สันทราย', 'หางดง', 'ฮอด', 'ดอยเต่า', 'อมก๋อย', 'สารภี', 'เวียงแหง', 'ไชยปราการ', 'แม่วาง', 'แม่ออน', 'ดอยหล่อ', 'กัลยาณิวัฒนา'],
  ตรัง: ['เมืองตรัง', 'กันตัง', 'ย่านตาขาว', 'ปะเหลียน', 'สิเกา', 'ห้วยยอด', 'วังวิเศษ', 'นาโยง', 'รัษฎา', 'หาดสำราญ'],
  ตราด: ['เมืองตราด', 'คลองใหญ่', 'เขาสมิง', 'บ่อไร่', 'แหลมงอบ', 'เกาะกูด', 'เกาะช้าง'],
  ตาก: ['เมืองตาก', 'บ้านตาก', 'สามเงา', 'แม่ระมาด', 'ท่าสองยาง', 'แม่สอด', 'พบพระ', 'อุ้มผาง', 'วังเจ้า'],
  นครนายก: ['เมืองนครนายก', 'ปากพลี', 'บ้านนา', 'องครักษ์'],
  นครปฐม: ['เมืองนครปฐม', 'กำแพงแสน', 'นครชัยศรี', 'ดอนตูม', 'บางเลน', 'สามพราน', 'พุทธมณฑล'],
  นครพนม: ['เมืองนครพนม', 'ปลาปาก', 'ท่าอุเทน', 'บ้านแพง', 'ธาตุพนม', 'เรณูนคร', 'นาแก', 'ศรีสงคราม', 'นาหว้า', 'โพนสวรรค์', 'นาทม', 'วังยาง'],
  นครราชสีมา: ['เมืองนครราชสีมา', 'ครบุรี', 'เสิงสาง', 'คง', 'บ้านเหลื่อม', 'จักราช', 'โชคชัย', 'ด่านขุนทด', 'โนนไทย', 'โนนสูง', 'ขามสะแกแสง', 'บัวใหญ่', 'ประทาย', 'ปักธงชัย', 'พิมาย', 'ห้วยแถลง', 'ชุมพวง', 'สูงเนิน', 'ขามทะเลสอ', 'สีคิ้ว', 'ปากช่อง', 'หนองบุญมาก', 'แก้งสนามนาง', 'โนนแดง', 'วังน้ำเขียว', 'เทพารักษ์', 'เมืองยาง', 'พระทองคำ', 'ลำทะเมนชัย', 'บัวลาย', 'สีดา', 'เฉลิมพระเกียรติ'],
  นครศรีธรรมราช: ['เมืองนครศรีธรรมราช', 'พรหมคีรี', 'ลานสกา', 'ฉวาง', 'พิปูน', 'เชียรใหญ่', 'ชะอวด', 'ท่าศาลา', 'ทุ่งสง', 'นาบอน', 'ทุ่งใหญ่', 'ปากพนัง', 'ร่อนพิบูลย์', 'สิชล', 'ขนอม', 'หัวไทร', 'บางขัน', 'ถ้ำพรรณรา', 'จุฬาภรณ์', 'พระพรหม', 'นบพิตำ', 'ช้างกลาง', 'เฉลิมพระเกียรติ'],
  นครสวรรค์: ['เมืองนครสวรรค์', 'โกรกพระ', 'ชุมแสง', 'หนองบัว', 'บรรพตพิสัย', 'เก้าเลี้ยว', 'ตาคลี', 'ท่าตะโก', 'ไพศาลี', 'พยุหะคีรี', 'ลาดยาว', 'ตากฟ้า', 'แม่วงก์', 'แม่เปิน', 'ชุมตาบง'],
  นนทบุรี: ['เมืองนนทบุรี', 'บางกรวย', 'บางใหญ่', 'บางบัวทอง', 'ไทรน้อย', 'ปากเกร็ด'],
  นราธิวาส: ['เมืองนราธิวาส', 'ตากใบ', 'บาเจาะ', 'ยี่งอ', 'ระแงะ', 'รือเสาะ', 'ศรีสาคร', 'แว้ง', 'สุคิริน', 'สุไหงโก-ลก', 'สุไหงปาดี', 'จะแนะ', 'เจาะไอร้อง'],
  น่าน: ['เมืองน่าน', 'แม่จริม', 'บ้านหลวง', 'นาน้อย', 'ปัว', 'ท่าวังผา', 'เวียงสา', 'ทุ่งช้าง', 'เชียงกลาง', 'นาหมื่น', 'สันติสุข', 'บ่อเกลือ', 'สองแคว', 'ภูเพียง', 'เฉลิมพระเกียรติ'],
  บึงกาฬ: ['เมืองบึงกาฬ', 'พรเจริญ', 'โซ่พิสัย', 'เซกา', 'ปากคาด', 'บึงโขงหลง', 'ศรีวิไล', 'บุ่งคล้า'],
  บุรีรัมย์: ['เมืองบุรีรัมย์', 'คูเมือง', 'กระสัง', 'นางรอง', 'หนองกี่', 'ละหานทราย', 'ประโคนชัย', 'บ้านกรวด', 'พุทไธสง', 'ลำปลายมาศ', 'สตึก', 'ปะคำ', 'นาโพธิ์', 'หนองหงส์', 'พลับพลาชัย', 'ห้วยราช', 'โนนสุวรรณ', 'ชำนิ', 'บ้านใหม่ไชยพจน์', 'โนนดินแดง', 'บ้านด่าน', 'แคนดง', 'เฉลิมพระเกียรติ'],
  ปทุมธานี: ['เมืองปทุมธานี', 'คลองหลวง', 'ธัญบุรี', 'หนองเสือ', 'ลาดหลุมแก้ว', 'ลำลูกกา', 'สามโคก'],
  ประจวบคีรีขันธ์: ['เมืองประจวบคีรีขันธ์', 'กุยบุรี', 'ทับสะแก', 'บางสะพาน', 'บางสะพานน้อย', 'ปราณบุรี', 'หัวหิน', 'สามร้อยยอด'],
  ปราจีนบุรี: ['เมืองปราจีนบุรี', 'กบินทร์บุรี', 'นาดี', 'บ้านสร้าง', 'ประจันตคาม', 'ศรีมหาโพธิ', 'ศรีมโหสถ'],
  ปัตตานี: ['เมืองปัตตานี', 'โคกโพธิ์', 'หนองจิก', 'ปะนาเระ', 'มายอ', 'ทุ่งยางแดง', 'สายบุรี', 'ไม้แก่น', 'ยะหริ่ง', 'ยะรัง', 'กะพ้อ', 'แม่ลาน'],
  พระนครศรีอยุธยา: ['พระนครศรีอยุธยา', 'ท่าเรือ', 'นครหลวง', 'บางไทร', 'บางบาล', 'บางปะอิน', 'บางปะหัน', 'ผักไห่', 'ภาชี', 'ลาดบัวหลวง', 'วังน้อย', 'เสนา', 'บางซ้าย', 'อุทัย', 'มหาราช', 'บ้านแพรก'],
  พังงา: ['เมืองพังงา', 'เกาะยาว', 'กะปง', 'ตะกั่วทุ่ง', 'ตะกั่วป่า', 'คุระบุรี', 'ทับปุด', 'ท้ายเหมือง'],
  พัทลุง: ['เมืองพัทลุง', 'กงหรา', 'เขาชัยสน', 'ตะโหมด', 'ควนขนุน', 'ปากพะยูน', 'ศรีบรรพต', 'ป่าบอน', 'บางแก้ว', 'ป่าพะยอม', 'ศรีนครินทร์'],
  พิจิตร: ['เมืองพิจิตร', 'วังทรายพูน', 'โพธิ์ประทับช้าง', 'ตะพานหิน', 'บางมูลนาก', 'โพทะเล', 'สามง่าม', 'ทับคล้อ', 'สากเหล็ก', 'บึงนาราง', 'ดงเจริญ', 'วชิรบารมี'],
  พิษณุโลก: ['เมืองพิษณุโลก', 'นครไทย', 'ชาติตระการ', 'บางระกำ', 'บางกระทุ่ม', 'พรหมพิราม', 'วัดโบสถ์', 'วังทอง', 'เนินมะปราง'],
  เพชรบุรี: ['เมืองเพชรบุรี', 'เขาย้อย', 'หนองหญ้าปล้อง', 'ชะอำ', 'ท่ายาง', 'บ้านลาด', 'บ้านแหลม', 'แก่งกระจาน'],
  เพชรบูรณ์: ['เมืองเพชรบูรณ์', 'ชนแดน', 'หล่มสัก', 'หล่มเก่า', 'วิเชียรบุรี', 'ศรีเทพ', 'หนองไผ่', 'บึงสามพัน', 'น้ำหนาว', 'วังโป่ง', 'เขาค้อ'],
  แพร่: ['เมืองแพร่', 'ร้องกวาง', 'ลอง', 'สูงเม่น', 'เด่นชัย', 'สอง', 'วังชิ้น', 'หนองม่วงไข่'],
  พะเยา: ['เมืองพะเยา', 'จุน', 'เชียงคำ', 'เชียงม่วน', 'ดอกคำใต้', 'ปง', 'แม่ใจ', 'ภูซาง', 'ภูกามยาว'],
  ภูเก็ต: ['เมืองภูเก็ต', 'กะทู้', 'ถลาง'],
  มหาสารคาม: ['เมืองมหาสารคาม', 'แกดำ', 'โกสุมพิสัย', 'กันทรวิชัย', 'เชียงยืน', 'บรบือ', 'นาเชือก', 'พยัคฆภูมิพิสัย', 'วาปีปทุม', 'นาดูน', 'ยางสีสุราช', 'กุดรัง', 'ชื่นชม'],
  มุกดาหาร: ['เมืองมุกดาหาร', 'นิคมคำสร้อย', 'ดอนตาล', 'ดงหลวง', 'คำชะอี', 'หว้านใหญ่', 'หนองสูง'],
  แม่ฮ่องสอน: ['เมืองแม่ฮ่องสอน', 'ขุนยวม', 'ปาย', 'แม่สะเรียง', 'แม่ลาน้อย', 'สบเมย', 'ปางมะผ้า'],
  ยโสธร: ['เมืองยโสธร', 'ทรายมูล', 'กุดชุม', 'คำเขื่อนแก้ว', 'ป่าติ้ว', 'มหาชนะชัย', 'ค้อวัง', 'เลิงนกทา', 'ไทยเจริญ'],
  ยะลา: ['เมืองยะลา', 'เบตง', 'บันนังสตา', 'ธารโต', 'ยะหา', 'รามัน', 'กาบัง', 'กรงปินัง'],
  ร้อยเอ็ด: ['เมืองร้อยเอ็ด', 'เกษตรวิสัย', 'ปทุมรัตต์', 'จตุรพักตรพิมาน', 'ธวัชบุรี', 'พนมไพร', 'โพนทอง', 'โพธิ์ชัย', 'หนองพอก', 'เสลภูมิ', 'สุวรรณภูมิ', 'เมืองสรวง', 'โพนทราย', 'อาจสามารถ', 'เมยวดี', 'ศรีสมเด็จ', 'จังหาร', 'เชียงขวัญ', 'หนองฮี', 'ทุ่งเขาหลวง'],
  ระนอง: ['เมืองระนอง', 'ละอุ่น', 'กะเปอร์', 'กระบุรี', 'สุขสำราญ'],
  ระยอง: ['เมืองระยอง', 'บ้านฉาง', 'แกลง', 'วังจันทร์', 'บ้านค่าย', 'ปลวกแดง', 'เขาชะเมา', 'นิคมพัฒนา'],
  ราชบุรี: ['เมืองราชบุรี', 'จอมบึง', 'สวนผึ้ง', 'ดำเนินสะดวก', 'บ้านโป่ง', 'บางแพ', 'โพธาราม', 'ปากท่อ', 'วัดเพลง', 'บ้านคา'],
  ลพบุรี: ['เมืองลพบุรี', 'พัฒนานิคม', 'โคกสำโรง', 'ชัยบาดาล', 'ท่าวุ้ง', 'บ้านหมี่', 'ท่าหลวง', 'สระโบสถ์', 'โคกเจริญ', 'ลำสนธิ', 'หนองม่วง'],
  ลำปาง: ['เมืองลำปาง', 'แม่เมาะ', 'เกาะคา', 'เสริมงาม', 'งาว', 'แจ้ห่ม', 'วังเหนือ', 'เถิน', 'แม่พริก', 'แม่ทะ', 'สบปราบ', 'ห้างฉัตร', 'เมืองปาน'],
  ลำพูน: ['เมืองลำพูน', 'แม่ทา', 'บ้านโฮ่ง', 'ลี้', 'ทุ่งหัวช้าง', 'ป่าซาง', 'บ้านธิ', 'เวียงหนองล่อง'],
  เลย: ['เมืองเลย', 'นาด้วง', 'เชียงคาน', 'ปากชม', 'ด่านซ้าย', 'นาแห้ว', 'ภูเรือ', 'ท่าลี่', 'วังสะพุง', 'ภูกระดึง', 'ภูหลวง', 'ผาขาว', 'เอราวัณ', 'หนองหิน'],
  ศรีสะเกษ: ['เมืองศรีสะเกษ', 'ยางชุมน้อย', 'กันทรารมย์', 'กันทรลักษ์', 'ขุขันธ์', 'ไพรบึง', 'ปรางค์กู่', 'ขุนหาญ', 'ราษีไศล', 'อุทุมพรพิสัย', 'บึงบูรพ์', 'ห้วยทับทัน', 'โนนคูณ', 'ศรีรัตนะ', 'น้ำเกลี้ยง', 'วังหิน', 'ภูสิงห์', 'เมืองจันทร์', 'เบญจลักษ์', 'พยุห์', 'โพธิ์ศรีสุวรรณ', 'ศิลาลาด'],
  สกลนคร: ['เมืองสกลนคร', 'กุสุมาลย์', 'กุดบาก', 'พรรณานิคม', 'พังโคน', 'วาริชภูมิ', 'นิคมน้ำอูน', 'วานรนิวาส', 'คำตากล้า', 'บ้านม่วง', 'อากาศอำนวย', 'สว่างแดนดิน', 'ส่องดาว', 'เต่างอย', 'โคกศรีสุพรรณ', 'เจริญศิลป์', 'โพนนาแก้ว', 'ภูพาน'],
  สงขลา: ['เมืองสงขลา', 'สทิงพระ', 'จะนะ', 'นาทวี', 'เทพา', 'สะบ้าย้อย', 'ระโนด', 'กระแสสินธุ์', 'รัตภูมิ', 'สะเดา', 'หาดใหญ่', 'นาหม่อม', 'ควนเนียง', 'บางกล่ำ', 'สิงหนคร', 'คลองหอยโข่ง'],
  สตูล: ['เมืองสตูล', 'ควนโดน', 'ควนกาหลง', 'ท่าแพ', 'ละงู', 'ทุ่งหว้า', 'มะนัง'],
  สมุทรปราการ: ['เมืองสมุทรปราการ', 'บางบ่อ', 'บางพลี', 'พระประแดง', 'พระสมุทรเจดีย์', 'บางเสาธง'],
  สมุทรสงคราม: ['เมืองสมุทรสงคราม', 'บางคนที', 'อัมพวา'],
  สมุทรสาคร: ['เมืองสมุทรสาคร', 'กระทุ่มแบน', 'บ้านแพ้ว'],
  สระแก้ว: ['เมืองสระแก้ว', 'คลองหาด', 'ตาพระยา', 'วังน้ำเย็น', 'วัฒนานคร', 'อรัญประเทศ', 'เขาฉกรรจ์', 'โคกสูง', 'วังสมบูรณ์'],
  สระบุรี: ['เมืองสระบุรี', 'แก่งคอย', 'หนองแค', 'วิหารแดง', 'หนองแซง', 'บ้านหมอ', 'ดอนพุด', 'หนองโดน', 'พระพุทธบาท', 'เสาไห้', 'มวกเหล็ก', 'วังม่วง', 'เฉลิมพระเกียรติ'],
  สิงห์บุรี: ['เมืองสิงห์บุรี', 'บางระจัน', 'ค่ายบางระจัน', 'พรหมบุรี', 'ท่าช้าง', 'อินทร์บุรี'],
  สุโขทัย: ['เมืองสุโขทัย', 'บ้านด่านลานหอย', 'คีรีมาศ', 'กงไกรลาศ', 'ศรีสัชนาลัย', 'ศรีสำโรง', 'สวรรคโลก', 'ศรีนคร', 'ทุ่งเสลี่ยม'],
  สุพรรณบุรี: ['เมืองสุพรรณบุรี', 'เดิมบางนางบวช', 'ด่านช้าง', 'บางปลาม้า', 'ศรีประจันต์', 'ดอนเจดีย์', 'สองพี่น้อง', 'สามชุก', 'อู่ทอง', 'หนองหญ้าไซ'],
  สุราษฎร์ธานี: ['เมืองสุราษฎร์ธานี', 'กาญจนดิษฐ์', 'ดอนสัก', 'เกาะสมุย', 'เกาะพะงัน', 'ไชยา', 'ท่าชนะ', 'คีรีรัฐนิคม', 'บ้านตาขุน', 'พนม', 'ท่าฉาง', 'บ้านนาสาร', 'บ้านนาเดิม', 'เคียนซา', 'เวียงสระ', 'พระแสง', 'พุนพิน', 'ชัยบุรี', 'วิภาวดี'],
  สุรินทร์: ['เมืองสุรินทร์', 'ชุมพลบุรี', 'ท่าตูม', 'จอมพระ', 'ปราสาท', 'กาบเชิง', 'รัตนบุรี', 'สนม', 'ศีขรภูมิ', 'สังขะ', 'ลำดวน', 'สำโรงทาบ', 'บัวเชด', 'พนมดงรัก', 'ศรีณรงค์', 'เขวาสินรินทร์', 'โนนนารายณ์'],
  หนองคาย: ['เมืองหนองคาย', 'ท่าบ่อ', 'โพนพิสัย', 'ศรีเชียงใหม่', 'สังคม', 'สระใคร', 'เฝ้าไร่', 'รัตนวาปี', 'โพธิ์ตาก'],
  หนองบัวลำภู: ['เมืองหนองบัวลำภู', 'นากลาง', 'โนนสัง', 'ศรีบุญเรือง', 'สุวรรณคูหา', 'นาวัง'],
  อ่างทอง: ['เมืองอ่างทอง', 'ไชโย', 'ป่าโมก', 'โพธิ์ทอง', 'แสวงหา', 'วิเศษชัยชาญ', 'สามโก้'],
  อำนาจเจริญ: ['เมืองอำนาจเจริญ', 'ชานุมาน', 'ปทุมราชวงศา', 'พนา', 'เสนางคนิคม', 'หัวตะพาน', 'ลืออำนาจ'],
  อุดรธานี: ['เมืองอุดรธานี', 'กุดจับ', 'หนองวัวซอ', 'กุมภวาปี', 'โนนสะอาด', 'หนองหาน', 'ทุ่งฝน', 'ไชยวาน', 'ศรีธาตุ', 'วังสามหมอ', 'บ้านดุง', 'บ้านผือ', 'น้ำโสม', 'เพ็ญ', 'สร้างคอม', 'หนองแสง', 'นายูง', 'พิบูลย์รักษ์', 'กู่แก้ว', 'ประจักษ์ศิลปาคม'],
  อุทัยธานี: ['เมืองอุทัยธานี', 'ทัพทัน', 'สว่างอารมณ์', 'หนองฉาง', 'หนองขาหย่าง', 'บ้านไร่', 'ลานสัก', 'ห้วยคต'],
  อุตรดิตถ์: ['เมืองอุตรดิตถ์', 'ตรอน', 'ท่าปลา', 'น้ำปาด', 'ฟากท่า', 'บ้านโคก', 'พิชัย', 'ลับแล', 'ทองแสนขัน'],
  อุบลราชธานี: ['เมืองอุบลราชธานี', 'ศรีเมืองใหม่', 'โขงเจียม', 'เขื่องใน', 'เขมราฐ', 'เดชอุดม', 'นาจะหลวย', 'น้ำยืน', 'บุณฑริก', 'ตระการพืชผล', 'กุดข้าวปุ้น', 'ม่วงสามสิบ', 'วารินชำราบ', 'พิบูลมังสาหาร', 'ตาลสุม', 'โพธิ์ไทร', 'สำโรง', 'ดอนมดแดง', 'สิรินธร', 'ทุ่งศรีอุดม', 'นาเยีย', 'นาตาล', 'เหล่าเสือโก้ก', 'สว่างวีระวงศ์', 'น้ำขุ่น'],
}

export type BtsMrtLine =
  | 'BTS_SUKHUMVIT'
  | 'BTS_SILOM'
  | 'BTS_GOLD'
  | 'MRT_BLUE'
  | 'MRT_PURPLE'
  | 'MRT_YELLOW'
  | 'MRT_PINK'
  | 'ARL'

export interface BtsMrtStation {
  id: number
  name: string
  nameEn?: string
  nameZh?: string
  line: BtsMrtLine
}

export const BTS_MRT_STATIONS: readonly BtsMrtStation[] = [

  { id: 1, name: 'หมอชิต (BTS)', nameEn: 'Mo Chit (BTS)', nameZh: '慕七 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 2, name: 'สะพานควาย (BTS)', nameEn: 'Saphan Khwai (BTS)', nameZh: '水牛桥 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 3, name: 'อารีย์ (BTS)', nameEn: 'Ari (BTS)', nameZh: '阿里 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 4, name: 'สนามเป้า (BTS)', nameEn: 'Sanam Pao (BTS)', nameZh: '沙楠包 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 5, name: 'อนุสาวรีย์ชัยฯ (BTS)', nameEn: 'Victory Monument (BTS)', nameZh: '胜利纪念碑 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 6, name: 'พญาไท (BTS)', nameEn: 'Phaya Thai (BTS)', nameZh: '披耶泰 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 7, name: 'ราชเทวี (BTS)', nameEn: 'Ratchathewi (BTS)', nameZh: '拉差贴威 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 8, name: 'สยาม (BTS)', nameEn: 'Siam (BTS)', nameZh: '暹罗 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 9, name: 'ชิดลม (BTS)', nameEn: 'Chit Lom (BTS)', nameZh: '七隆 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 10, name: 'เพลินจิต (BTS)', nameEn: 'Phloen Chit (BTS)', nameZh: '奔集 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 11, name: 'นานา (BTS)', nameEn: 'Nana (BTS)', nameZh: '那那 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 12, name: 'อโศก (BTS)', nameEn: 'Asok (BTS)', nameZh: '阿索克 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 13, name: 'พร้อมพงษ์ (BTS)', nameEn: 'Phrom Phong (BTS)', nameZh: '鹏蓬 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 14, name: 'ทองหล่อ (BTS)', nameEn: 'Thong Lo (BTS)', nameZh: '通罗 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 15, name: 'เอกมัย (BTS)', nameEn: 'Ekkamai (BTS)', nameZh: '亿甲迈 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 16, name: 'พระโขนง (BTS)', nameEn: 'Phra Khanong (BTS)', nameZh: '拍昆仑 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 17, name: 'อ่อนนุช (BTS)', nameEn: 'On Nut (BTS)', nameZh: '安努 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 18, name: 'บางจาก (BTS)', nameEn: 'Bang Chak (BTS)', nameZh: '挽节 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 19, name: 'ปุณณวิถี (BTS)', nameEn: 'Punnawithi (BTS)', nameZh: '布纳威提 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 20, name: 'อุดมสุข (BTS)', nameEn: 'Udom Suk (BTS)', nameZh: '乌东素 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 21, name: 'บางนา (BTS)', nameEn: 'Bang Na (BTS)', nameZh: '挽那 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 22, name: 'แบริ่ง (BTS)', nameEn: 'Bearing (BTS)', nameZh: '北宁 (BTS)', line: 'BTS_SUKHUMVIT' },

  { id: 23, name: 'สนามกีฬาแห่งชาติ (BTS)', nameEn: 'National Stadium (BTS)', nameZh: '国家运动场 (BTS)', line: 'BTS_SILOM' },
  { id: 24, name: 'ราชดำริ (BTS)', nameEn: 'Ratchadamri (BTS)', nameZh: '拉差丹利 (BTS)', line: 'BTS_SILOM' },
  { id: 25, name: 'ศาลาแดง (BTS)', nameEn: 'Sala Daeng (BTS)', nameZh: '沙拉铃 (BTS)', line: 'BTS_SILOM' },
  { id: 26, name: 'ช่องนนทรี (BTS)', nameEn: 'Chong Nonsi (BTS)', nameZh: '冲暖诗 (BTS)', line: 'BTS_SILOM' },
  { id: 27, name: 'เซนต์หลุยส์ (BTS)', nameEn: 'Saint Louis (BTS)', nameZh: '圣类思 (BTS)', line: 'BTS_SILOM' },
  { id: 28, name: 'สุรศักดิ์ (BTS)', nameEn: 'Surasak (BTS)', nameZh: '素拉刹 (BTS)', line: 'BTS_SILOM' },
  { id: 29, name: 'สะพานตากสิน (BTS)', nameEn: 'Saphan Taksin (BTS)', nameZh: '郑皇桥 (BTS)', line: 'BTS_SILOM' },

  { id: 30, name: 'สีลม (MRT)', nameEn: 'Si Lom (MRT)', nameZh: '是隆 (MRT)', line: 'MRT_BLUE' },
  { id: 31, name: 'ลุมพินี (MRT)', nameEn: 'Lumphini (MRT)', nameZh: '是乐园 (MRT)', line: 'MRT_BLUE' },
  { id: 32, name: 'คลองเตย (MRT)', nameEn: 'Khlong Toei (MRT)', nameZh: '孔提 (MRT)', line: 'MRT_BLUE' },
  { id: 33, name: 'ศูนย์การประชุมแห่งชาติสิริกิติ์ (MRT)', nameEn: 'Queen Sirikit National Convention Centre (MRT)', nameZh: '诗丽吉王后国家会议中心 (MRT)', line: 'MRT_BLUE' },
  { id: 34, name: 'สุขุมวิท (MRT)', nameEn: 'Sukhumvit (MRT)', nameZh: '素坤逸 (MRT)', line: 'MRT_BLUE' },
  { id: 35, name: 'เพชรบุรี (MRT)', nameEn: 'Phetchaburi (MRT)', nameZh: '碧武里 (MRT)', line: 'MRT_BLUE' },
  { id: 36, name: 'พระราม 9 (MRT)', nameEn: 'Phra Ram 9 (MRT)', nameZh: '拍喃九 (MRT)', line: 'MRT_BLUE' },
  { id: 37, name: 'ศูนย์วัฒนธรรมแห่งประเทศไทย (MRT)', nameEn: 'Thailand Cultural Centre (MRT)', nameZh: '泰国文化中心 (MRT)', line: 'MRT_BLUE' },
  { id: 38, name: 'ห้วยขวาง (MRT)', nameEn: 'Huai Khwang (MRT)', nameZh: '汇权 (MRT)', line: 'MRT_BLUE' },
  { id: 39, name: 'สุทธิสาร (MRT)', nameEn: 'Sutthisan (MRT)', nameZh: '素铁讪 (MRT)', line: 'MRT_BLUE' },
  { id: 40, name: 'รัชดาภิเษก (MRT)', nameEn: 'Ratchadaphisek (MRT)', nameZh: '叻猜拉披色 (MRT)', line: 'MRT_BLUE' },
  { id: 41, name: 'ลาดพร้าว (MRT)', nameEn: 'Lat Phrao (MRT)', nameZh: '叻抛 (MRT)', line: 'MRT_BLUE' },
  { id: 42, name: 'พหลโยธิน (MRT)', nameEn: 'Phahon Yothin (MRT)', nameZh: '拍凤裕庭 (MRT)', line: 'MRT_BLUE' },
  { id: 43, name: 'สวนจตุจักร (MRT)', nameEn: 'Chatuchak Park (MRT)', nameZh: '乍都节公园 (MRT)', line: 'MRT_BLUE' },
  { id: 44, name: 'กำแพงเพชร (MRT)', nameEn: 'Kamphaeng Phet (MRT)', nameZh: '甘烹碧 (MRT)', line: 'MRT_BLUE' },
  { id: 45, name: 'บางซื่อ (MRT)', nameEn: 'Bang Sue (MRT)', nameZh: '挽赐 (MRT)', line: 'MRT_BLUE' },

  { id: 46, name: 'เตาปูน (MRT)', nameEn: 'Tao Poon (MRT)', nameZh: '岛本 (MRT)', line: 'MRT_PURPLE' },
  { id: 47, name: 'บางซ่อน (MRT)', nameEn: 'Bang Son (MRT)', nameZh: '曼嵩 (MRT)', line: 'MRT_PURPLE' },
  { id: 48, name: 'วงศ์สว่าง (MRT)', nameEn: 'Wong Sawang (MRT)', nameZh: '翁沙旺 (MRT)', line: 'MRT_PURPLE' },
  { id: 49, name: 'แยกติวานนท์ (MRT)', nameEn: 'Yaek Tiwanon (MRT)', nameZh: '迪哇暖交叉口 (MRT)', line: 'MRT_PURPLE' },
  { id: 50, name: 'กระทรวงสาธารณสุข (MRT)', nameEn: 'Ministry of Public Health (MRT)', nameZh: '公共卫生部 (MRT)', line: 'MRT_PURPLE' },
  { id: 51, name: 'แยกนนทบุรี 1 (MRT)', nameEn: 'Yaek Nonthaburi 1 (MRT)', nameZh: '暖武里1巷交叉口 (MRT)', line: 'MRT_PURPLE' },
  { id: 52, name: 'บางกระสอ (MRT)', nameEn: 'Bang Krasor (MRT)', nameZh: '曼卡秀 (MRT)', line: 'MRT_PURPLE' },
  { id: 53, name: 'ศูนย์ราชการนนทบุรี (MRT)', nameEn: 'Nonthaburi Civic Center (MRT)', nameZh: '暖武里市民中心 (MRT)', line: 'MRT_PURPLE' },

  { id: 54, name: 'ห้าแยกลาดพร้าว (BTS)', nameEn: 'Ha Yaek Lat Phrao (BTS)', nameZh: '叻抛五岔路口 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 55, name: 'พหลโยธิน 24 (BTS)', nameEn: 'Phahon Yothin 24 (BTS)', nameZh: '帕鸿裕庭24巷 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 56, name: 'รัชโยธิน (BTS)', nameEn: 'Ratchayothin (BTS)', nameZh: '拉差裕庭 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 57, name: 'เสนานิคม (BTS)', nameEn: 'Sena Nikhom (BTS)', nameZh: '社那尼空 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 58, name: 'มหาวิทยาลัยเกษตรศาสตร์ (BTS)', nameEn: 'Kasetsart University (BTS)', nameZh: '农业大学 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 59, name: 'บางบัว (BTS)', nameEn: 'Bang Bua (BTS)', nameZh: '曼博 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 60, name: 'กรมป่าไม้ (BTS)', nameEn: 'Royal Forest Department (BTS)', nameZh: '林业局 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 61, name: 'วัดพระศรีมหาธาตุ (BTS)', nameEn: 'Wat Phra Sri Mahathat (BTS)', nameZh: '帕希玛哈塔寺 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 62, name: 'พหลโยธิน 59 (BTS)', nameEn: 'Phahon Yothin 59 (BTS)', nameZh: '帕鸿裕庭59巷 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 63, name: 'สายหยุด (BTS)', nameEn: 'Sai Yut (BTS)', nameZh: '赛育 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 64, name: 'สะพานใหม่ (BTS)', nameEn: 'Saphan Mai (BTS)', nameZh: '新桥 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 65, name: 'รพ.ภูมิพลอดุลยเดช (BTS)', nameEn: 'Bhumibol Adulyadej Hospital (BTS)', nameZh: '普密蓬医院 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 66, name: 'แยก คปอ. (BTS)', nameEn: 'Yaek Kor Por Aor (BTS)', nameZh: '安委会岔路口 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 67, name: 'คูคต (BTS)', nameEn: 'Khu Khot (BTS)', nameZh: '窟口 (BTS)', line: 'BTS_SUKHUMVIT' },

  { id: 68, name: 'สำโรง (BTS)', nameEn: 'Samrong (BTS)', nameZh: '三榕 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 69, name: 'ปู่เจ้า (BTS)', nameEn: 'Pu Chao (BTS)', nameZh: '普昭 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 70, name: 'ช้างเอราวัณ (BTS)', nameEn: 'Chang Erawan (BTS)', nameZh: '象神 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 71, name: 'โรงเรียนนายเรือ (BTS)', nameEn: 'Royal Thai Naval Academy (BTS)', nameZh: '海军学院 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 72, name: 'ปากน้ำ (BTS)', nameEn: 'Pak Nam (BTS)', nameZh: '北榄 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 73, name: 'ศรีนครินทร์ (BTS)', nameEn: 'Srinagarindra (BTS)', nameZh: '诗纳卡琳 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 74, name: 'แพรกษา (BTS)', nameEn: 'Phraek Sa (BTS)', nameZh: '佩甲沙 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 75, name: 'สายลวด (BTS)', nameEn: 'Sai Luat (BTS)', nameZh: '赛露 (BTS)', line: 'BTS_SUKHUMVIT' },
  { id: 76, name: 'เคหะฯ (BTS)', nameEn: 'Kheha (BTS)', nameZh: '凯哈 (BTS)', line: 'BTS_SUKHUMVIT' },

  { id: 77, name: 'กรุงธนบุรี (BTS)', nameEn: 'Krung Thon Buri (BTS)', nameZh: '吞武里城 (BTS)', line: 'BTS_SILOM' },
  { id: 78, name: 'วงเวียนใหญ่ (BTS)', nameEn: 'Wongwian Yai (BTS)', nameZh: '大罗斗圈 (BTS)', line: 'BTS_SILOM' },
  { id: 79, name: 'โพธิ์นิมิตร (BTS)', nameEn: 'Pho Nimit (BTS)', nameZh: '菩尼密 (BTS)', line: 'BTS_SILOM' },
  { id: 80, name: 'ตลาดพลู (BTS)', nameEn: 'Talat Phlu (BTS)', nameZh: '哒叻普 (BTS)', line: 'BTS_SILOM' },
  { id: 81, name: 'วุฒากาศ (BTS)', nameEn: 'Wutthakat (BTS)', nameZh: '武他甲 (BTS)', line: 'BTS_SILOM' },
  { id: 82, name: 'บางหว้า (BTS)', nameEn: 'Bang Wa (BTS)', nameZh: '曼瓦 (BTS)', line: 'BTS_SILOM' },

  { id: 83, name: 'เจริญนคร (Gold Line)', nameEn: 'Charoen Nakhon (Gold Line)', nameZh: '乍能纳空 (金线)', line: 'BTS_GOLD' },
  { id: 84, name: 'คลองสาน (Gold Line)', nameEn: 'Khlong San (Gold Line)', nameZh: '空讪 (金线)', line: 'BTS_GOLD' },

  { id: 85, name: 'หัวลำโพง (MRT)', nameEn: 'Hua Lamphong (MRT)', nameZh: '华喃峰 (MRT)', line: 'MRT_BLUE' },
  { id: 86, name: 'วัดมังกร (MRT)', nameEn: 'Wat Mangkon (MRT)', nameZh: '龙莲寺 (MRT)', line: 'MRT_BLUE' },
  { id: 87, name: 'สามยอด (MRT)', nameEn: 'Sam Yot (MRT)', nameZh: '三峰 (MRT)', line: 'MRT_BLUE' },
  { id: 88, name: 'สนามไชย (MRT)', nameEn: 'Sanam Chai (MRT)', nameZh: '沙南猜 (MRT)', line: 'MRT_BLUE' },
  { id: 89, name: 'อิสรภาพ (MRT)', nameEn: 'Itsaraphap (MRT)', nameZh: '伊沙拉帕 (MRT)', line: 'MRT_BLUE' },
  { id: 90, name: 'ท่าพระ (MRT)', nameEn: 'Tha Phra (MRT)', nameZh: '塔帕 (MRT)', line: 'MRT_BLUE' },
  { id: 91, name: 'บางไผ่ (MRT)', nameEn: 'Bang Phai (MRT)', nameZh: '曼派 (MRT)', line: 'MRT_BLUE' },
  { id: 92, name: 'บางหว้า (MRT)', nameEn: 'Bang Wa (MRT)', nameZh: '曼瓦 (MRT)', line: 'MRT_BLUE' },
  { id: 93, name: 'เพชรเกษม 48 (MRT)', nameEn: 'Phetkasem 48 (MRT)', nameZh: '碧甲盛48 (MRT)', line: 'MRT_BLUE' },
  { id: 94, name: 'ภาษีเจริญ (MRT)', nameEn: 'Phasi Charoen (MRT)', nameZh: '帕世乍能 (MRT)', line: 'MRT_BLUE' },
  { id: 95, name: 'บางแค (MRT)', nameEn: 'Bang Khae (MRT)', nameZh: '挽坑 (MRT)', line: 'MRT_BLUE' },
  { id: 96, name: 'หลักสอง (MRT)', nameEn: 'Lak Song (MRT)', nameZh: '叻松 (MRT)', line: 'MRT_BLUE' },
  { id: 97, name: 'จรัญสนิทวงศ์ 13 (MRT)', nameEn: 'Charan 13 (MRT)', nameZh: '乍伦13 (MRT)', line: 'MRT_BLUE' },
  { id: 98, name: 'ไฟฉาย (MRT)', nameEn: 'Fai Chai (MRT)', nameZh: '发彩 (MRT)', line: 'MRT_BLUE' },
  { id: 99, name: 'บางขุนนนท์ (MRT)', nameEn: 'Bang Khun Non (MRT)', nameZh: '曼坤暖 (MRT)', line: 'MRT_BLUE' },
  { id: 100, name: 'บางยี่ขัน (MRT)', nameEn: 'Bang Yi Khan (MRT)', nameZh: '曼益康 (MRT)', line: 'MRT_BLUE' },
  { id: 101, name: 'สิรินธร (MRT)', nameEn: 'Sirindhorn (MRT)', nameZh: '诗琳通 (MRT)', line: 'MRT_BLUE' },

  { id: 102, name: 'คลองบางไผ่ (MRT)', nameEn: 'Khlong Bang Phai (MRT)', nameZh: '空曼派 (MRT)', line: 'MRT_PURPLE' },
  { id: 103, name: 'ตลาดบางใหญ่ (MRT)', nameEn: 'Talad Bang Yai (MRT)', nameZh: '曼艾市场 (MRT)', line: 'MRT_PURPLE' },
  { id: 104, name: 'สามแยกบางใหญ่ (MRT)', nameEn: 'Sam Yaek Bang Yai (MRT)', nameZh: '曼艾交叉口 (MRT)', line: 'MRT_PURPLE' },
  { id: 105, name: 'บางพลู (MRT)', nameEn: 'Bang Phlu (MRT)', nameZh: '曼普 (MRT)', line: 'MRT_PURPLE' },
  { id: 106, name: 'บางรักใหญ่ (MRT)', nameEn: 'Bang Rak Yai (MRT)', nameZh: '曼乐艾 (MRT)', line: 'MRT_PURPLE' },
  { id: 107, name: 'บางรักน้อย-ท่าอิฐ (MRT)', nameEn: 'Bang Rak Noi Tha It (MRT)', nameZh: '曼乐莲-塔义 (MRT)', line: 'MRT_PURPLE' },
  { id: 108, name: 'ไทรม้า (MRT)', nameEn: 'Sai Ma (MRT)', nameZh: '赛马 (MRT)', line: 'MRT_PURPLE' },
  { id: 109, name: 'สะพานพระนั่งเกล้า (MRT)', nameEn: 'Phra Nang Klao Bridge (MRT)', nameZh: '三世王桥 (MRT)', line: 'MRT_PURPLE' },

  { id: 110, name: 'ลาดพร้าว (MRT Yellow)', nameEn: 'Lat Phrao (MRT Yellow)', nameZh: '叻抛 (黄线)', line: 'MRT_YELLOW' },
  { id: 111, name: 'ภาวนา (MRT Yellow)', nameEn: 'Phawana (MRT Yellow)', nameZh: '拍瓦那 (黄线)', line: 'MRT_YELLOW' },
  { id: 112, name: 'โชคชัย 4 (MRT Yellow)', nameEn: 'Chok Chai 4 (MRT Yellow)', nameZh: '促猜4 (黄线)', line: 'MRT_YELLOW' },
  { id: 113, name: 'ลาดพร้าว 71 (MRT Yellow)', nameEn: 'Lat Phrao 71 (MRT Yellow)', nameZh: '叻抛71 (黄线)', line: 'MRT_YELLOW' },
  { id: 114, name: 'ลาดพร้าว 83 (MRT Yellow)', nameEn: 'Lat Phrao 83 (MRT Yellow)', nameZh: '叻抛83 (黄线)', line: 'MRT_YELLOW' },
  { id: 115, name: 'มหาดไทย (MRT Yellow)', nameEn: 'Mahat Thai (MRT Yellow)', nameZh: '玛哈泰 (黄线)', line: 'MRT_YELLOW' },
  { id: 116, name: 'ลาดพร้าว 101 (MRT Yellow)', nameEn: 'Lat Phrao 101 (MRT Yellow)', nameZh: '叻抛101 (黄线)', line: 'MRT_YELLOW' },
  { id: 117, name: 'บางกะปิ (MRT Yellow)', nameEn: 'Bang Kapi (MRT Yellow)', nameZh: '曼卡比 (黄线)', line: 'MRT_YELLOW' },
  { id: 118, name: 'แยกลำสาลี (MRT Yellow)', nameEn: 'Yaek Lam Sali (MRT Yellow)', nameZh: '蓝沙利岔路口 (黄线)', line: 'MRT_YELLOW' },
  { id: 119, name: 'ศรีกรีฑา (MRT Yellow)', nameEn: 'Si Kritha (MRT Yellow)', nameZh: '是基他 (黄线)', line: 'MRT_YELLOW' },
  { id: 120, name: 'หัวหมาก (MRT Yellow)', nameEn: 'Hua Mak (MRT Yellow)', nameZh: '华玛 (黄线)', line: 'MRT_YELLOW' },
  { id: 121, name: 'กลันตัน (MRT Yellow)', nameEn: 'Kalantan (MRT Yellow)', nameZh: '吉兰丹 (黄线)', line: 'MRT_YELLOW' },
  { id: 122, name: 'ศรีนุช (MRT Yellow)', nameEn: 'Si Nut (MRT Yellow)', nameZh: '是努 (黄线)', line: 'MRT_YELLOW' },
  { id: 123, name: 'ศรีนครินทร์ 38 (MRT Yellow)', nameEn: 'Srinagarindra 38 (MRT Yellow)', nameZh: '诗纳卡琳38 (黄线)', line: 'MRT_YELLOW' },
  { id: 124, name: 'สวนหลวง ร.9 (MRT Yellow)', nameEn: 'Suan Luang Rama 9 (MRT Yellow)', nameZh: '拉玛九世王御苑 (黄线)', line: 'MRT_YELLOW' },
  { id: 125, name: 'ศรีอุดม (MRT Yellow)', nameEn: 'Si Udom (MRT Yellow)', nameZh: '是乌龙 (黄线)', line: 'MRT_YELLOW' },
  { id: 126, name: 'ศรีเอี่ยม (MRT Yellow)', nameEn: 'Si Iam (MRT Yellow)', nameZh: '是任 (黄线)', line: 'MRT_YELLOW' },
  { id: 127, name: 'ศรีลาซาล (MRT Yellow)', nameEn: 'Si La Salle (MRT Yellow)', nameZh: '是拉塞尔 (黄线)', line: 'MRT_YELLOW' },
  { id: 128, name: 'ศรีแบริ่ง (MRT Yellow)', nameEn: 'Si Bearing (MRT Yellow)', nameZh: '是北宁 (黄线)', line: 'MRT_YELLOW' },
  { id: 129, name: 'ศรีด่าน (MRT Yellow)', nameEn: 'Si Dan (MRT Yellow)', nameZh: '是丹 (黄线)', line: 'MRT_YELLOW' },
  { id: 130, name: 'ศรีเทพา (MRT Yellow)', nameEn: 'Si Thepha (MRT Yellow)', nameZh: '是提帕 (黄线)', line: 'MRT_YELLOW' },
  { id: 131, name: 'ทิพวัล (MRT Yellow)', nameEn: 'Thipphawan (MRT Yellow)', nameZh: '提帕万 (黄线)', line: 'MRT_YELLOW' },
  { id: 132, name: 'สำโรง (MRT Yellow)', nameEn: 'Samrong (MRT Yellow)', nameZh: '三榕 (黄线)', line: 'MRT_YELLOW' },

  { id: 133, name: 'ศูนย์ราชการนนทบุรี (MRT Pink)', nameEn: 'Nonthaburi Civic Center (MRT Pink)', nameZh: '暖武里市民中心 (粉红线)', line: 'MRT_PINK' },
  { id: 134, name: 'แคราย (MRT Pink)', nameEn: 'Khae Rai (MRT Pink)', nameZh: '克莱 (粉红线)', line: 'MRT_PINK' },
  { id: 135, name: 'สนามบินน้ำ (MRT Pink)', nameEn: 'Sanam Bin Nam (MRT Pink)', nameZh: '沙楠滨南 (粉红线)', line: 'MRT_PINK' },
  { id: 136, name: 'สามัคคี (MRT Pink)', nameEn: 'Samakkhi (MRT Pink)', nameZh: '沙玛奇 (粉红线)', line: 'MRT_PINK' },
  { id: 137, name: 'กรมชลประทาน (MRT Pink)', nameEn: 'Royal Irrigation Department (MRT Pink)', nameZh: '水利局 (粉红线)', line: 'MRT_PINK' },
  { id: 138, name: 'แยกปากเกร็ด (MRT Pink)', nameEn: 'Yaek Pak Kret (MRT Pink)', nameZh: '北革 (粉红线)', line: 'MRT_PINK' },
  { id: 139, name: 'เลี่ยงเมืองปากเกร็ด (MRT Pink)', nameEn: 'Pak Kret Bypass (MRT Pink)', nameZh: '北革环路 (粉红线)', line: 'MRT_PINK' },
  { id: 140, name: 'แจ้งวัฒนะ-ปากเกร็ด 28 (MRT Pink)', nameEn: 'Chaeng Watthana-Pak Kret 28 (MRT Pink)', nameZh: '政哇他那-北革28巷 (粉红线)', line: 'MRT_PINK' },
  { id: 141, name: 'ศรีรัช (MRT Pink)', nameEn: 'Si Rat (MRT Pink)', nameZh: '希乐 (粉红线)', line: 'MRT_PINK' },
  { id: 142, name: 'เมืองทองธานี (MRT Pink)', nameEn: 'Muang Thong Thani (MRT Pink)', nameZh: '蒙通他尼 (粉红线)', line: 'MRT_PINK' },
  { id: 143, name: 'แจ้งวัฒนะ 14 (MRT Pink)', nameEn: 'Chaeng Watthana 14 (MRT Pink)', nameZh: '政哇他那14巷 (粉红线)', line: 'MRT_PINK' },
  { id: 144, name: 'ศูนย์ราชการเฉลิมพระเกียรติ (MRT Pink)', nameEn: 'Government Complex (MRT Pink)', nameZh: '崇圣市民中心 (粉红线)', line: 'MRT_PINK' },
  { id: 145, name: 'โทรคมนาคมแห่งชาติ (MRT Pink)', nameEn: 'National Telecom (MRT Pink)', nameZh: '泰国电信 (粉红线)', line: 'MRT_PINK' },
  { id: 146, name: 'หลักสี่ (MRT Pink)', nameEn: 'Lak Si (MRT Pink)', nameZh: '叻四 (粉红线)', line: 'MRT_PINK' },
  { id: 147, name: 'ราชภัฏพระนคร (MRT Pink)', nameEn: 'Rajabhat Phranakhon (MRT Pink)', nameZh: '帕那空皇大 (粉红线)', line: 'MRT_PINK' },
  { id: 148, name: 'วัดพระศรีมหาธาตุ (MRT Pink)', nameEn: 'Wat Phra Sri Mahathat (MRT Pink)', nameZh: '帕希玛哈塔寺 (粉红线)', line: 'MRT_PINK' },
  { id: 149, name: 'รามอินทรา 3 (MRT Pink)', nameEn: 'Ram Inthra 3 (MRT Pink)', nameZh: '蓝英他3巷 (粉红线)', line: 'MRT_PINK' },
  { id: 150, name: 'ลาดปลาเค้า (MRT Pink)', nameEn: 'Lat Pla Khao (MRT Pink)', nameZh: '拉巴考 (粉红线)', line: 'MRT_PINK' },
  { id: 151, name: 'รามอินทรา กม.4 (MRT Pink)', nameEn: 'Ram Inthra KM.4 (MRT Pink)', nameZh: '蓝英他公里4 (粉红线)', line: 'MRT_PINK' },
  { id: 152, name: 'มัยลาภ (MRT Pink)', nameEn: 'Maiyalap (MRT Pink)', nameZh: '迈雅蜡 (粉红线)', line: 'MRT_PINK' },
  { id: 153, name: 'วัชรพล (MRT Pink)', nameEn: 'Watcharaphon (MRT Pink)', nameZh: '哇差拉蓬 (粉红线)', line: 'MRT_PINK' },
  { id: 154, name: 'รามอินทรา กม.6 (MRT Pink)', nameEn: 'Ram Inthra KM.6 (MRT Pink)', nameZh: '蓝英他公里6 (粉红线)', line: 'MRT_PINK' },
  { id: 155, name: 'คู้บอน (MRT Pink)', nameEn: 'Khu Bon (MRT Pink)', nameZh: '窟邦 (粉红线)', line: 'MRT_PINK' },
  { id: 156, name: 'รามอินทรา กม.9 (MRT Pink)', nameEn: 'Ram Inthra KM.9 (MRT Pink)', nameZh: '蓝英他公里9 (粉红线)', line: 'MRT_PINK' },
  { id: 157, name: 'วงแหวนรามอินทรา (MRT Pink)', nameEn: 'Outer Ring Road - Ram Inthra (MRT Pink)', nameZh: '外环路东-蓝英他 (粉红线)', line: 'MRT_PINK' },
  { id: 158, name: 'นพรัตน์ (MRT Pink)', nameEn: 'Nopparat (MRT Pink)', nameZh: '诺帕拉 (粉红线)', line: 'MRT_PINK' },
  { id: 159, name: 'บางชัน (MRT Pink)', nameEn: 'Bang Chan (MRT Pink)', nameZh: '曼参 (粉红线)', line: 'MRT_PINK' },
  { id: 160, name: 'เศรษฐบุตรบำเพ็ญ (MRT Pink)', nameEn: 'Setthabut Bamphen (MRT Pink)', nameZh: '社博邦聘 (粉红线)', line: 'MRT_PINK' },
  { id: 161, name: 'ตลาดมีนบุรี (MRT Pink)', nameEn: 'Min Buri Market (MRT Pink)', nameZh: '民武里市场 (粉红线)', line: 'MRT_PINK' },
  { id: 162, name: 'มีนบุรี (MRT Pink)', nameEn: 'Min Buri (MRT Pink)', nameZh: '民武里 (粉红线)', line: 'MRT_PINK' },

  { id: 163, name: 'พญาไท (Airport Link)', nameEn: 'Phaya Thai (Airport Link)', nameZh: '披耶泰 (机场铁路)', line: 'ARL' },
  { id: 164, name: 'ราชปรารภ (Airport Link)', nameEn: 'Ratchaprarop (Airport Link)', nameZh: '叻猜巴洛 (机场铁路)', line: 'ARL' },
  { id: 165, name: 'มักกะสัน (Airport Link)', nameEn: 'Makkasan (Airport Link)', nameZh: '玛卡珊 (机场铁路)', line: 'ARL' },
  { id: 166, name: 'รามคำแหง (Airport Link)', nameEn: 'Ramkhamhaeng (Airport Link)', nameZh: '兰甘亨 (机场铁路)', line: 'ARL' },
  { id: 167, name: 'หัวหมาก (Airport Link)', nameEn: 'Hua Mak (Airport Link)', nameZh: '华玛 (机场铁路)', line: 'ARL' },
  { id: 168, name: 'บ้านทับช้าง (Airport Link)', nameEn: 'Ban Thap Chang (Airport Link)', nameZh: '班塔昌 (机场铁路)', line: 'ARL' },
  { id: 169, name: 'ลาดกระบัง (Airport Link)', nameEn: 'Lat Krabang (Airport Link)', nameZh: '莱卡邦 (机场铁路)', line: 'ARL' },
  { id: 170, name: 'สุวรรณภูมิ (Airport Link)', nameEn: 'Suvarnabhumi (Airport Link)', nameZh: '素万那普 (机场铁路)', line: 'ARL' },
]

export const BTS_MRT_STATION_BY_ID: ReadonlyMap<number, BtsMrtStation> = new Map(
  BTS_MRT_STATIONS.map((s) => [s.id, s]),
)

export function localizedStationName(station: BtsMrtStation, lang: string): string {
  if (lang.startsWith('zh')) return station.nameZh || station.nameEn || station.name
  if (lang.startsWith('en')) return station.nameEn || station.name
  return station.name
}

export function stationDisplayName(id: number, lang: string): string {
  const station = BTS_MRT_STATION_BY_ID.get(id)
  return station ? localizedStationName(station, lang) : String(id)
}

export function stationSearchText(station: BtsMrtStation): string {
  return `${station.name} ${station.nameEn ?? ''} ${station.nameZh ?? ''}`.toLowerCase()
}

export function getBtsMrtOptions(lang: string): { value: string; label: string }[] {
  return BTS_MRT_STATIONS.map((s) => ({ value: String(s.id), label: localizedStationName(s, lang) }))
}

export type Province = (typeof PROVINCES)[number]

export function localizedProvince(province: string, lang: string): string {
  const tr = PROVINCE_I18N[province]
  if (!tr) return province
  if (lang.startsWith('zh')) return tr.zh || tr.en || province
  if (lang.startsWith('en')) return tr.en || province
  return province
}

export function localizedDistrict(district: string, lang: string): string {
  const tr = DISTRICT_I18N[district]
  if (!tr) return district
  if (lang.startsWith('zh')) return tr.zh || tr.en || district
  if (lang.startsWith('en')) return tr.en || district
  return district
}
