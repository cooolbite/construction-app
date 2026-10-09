<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
# AGENTS.md — SDLC Agentic Workflow & Automated SOP

## 1. Automation & Git Enforcement Protocol
- **Trigger Condition:** ทำงานทันทีหลังเสร็จสิ้นกระบวนการแก้ไข สร้าง หรือลบไฟล์โค้ด
- **Execution Workflow:**
  1. `git status` — ตรวจสอบรายการไฟล์ที่มีการเปลี่ยนแปลง ป้องกันการ commit ไฟล์ขยะหรือ credential
  2. `git add <target-files>` — ทำการ stage เฉพาะไฟล์ที่เกี่ยวข้องกับงาน
  3. `git commit -m "<type>(<scope>): <summary>"` — กำหนดข้อความ commit ตาม Conventional Commits (`feat`, `fix`, `refactor`, `test`, `chore`)
  4. `git push origin <current-branch>` — ส่งโค้ดขึ้น remote repository ทันที

---

## 2. SDLC Execution Workflow & Skill Mapping

### Phase 1: Planning & Requirements Analysis
* **Mapped Skills:** `brainstorming`, `llm-prompt-optimizer`
* **Process / SOP:**
  1. สรุปความต้องการและระบุขอบเขตของงาน (Scope Definition)
  2. แยกแยะ Acceptance Criteria และ Edge Cases ที่อาจเกิดขึ้น
  3. ใช้ทักษะ `brainstorming` เปรียบเทียบทางเลือกเชิงเทคนิค และเลือกแนวทางที่มีผลกระทบข้างเคียงน้อยที่สุด
  4. ใช้ `llm-prompt-optimizer` แปลงโจทย์ให้เป็น technical tasks ย่อยที่มีความชัดเจน
* **Gate Criteria:** ต้องมีรายการ Acceptance Criteria และ Functional Scope ที่ชัดเจนก่อนเข้าสู่ขั้นตอนออกแบบ

---

### Phase 2: Architecture & System Design
* **Mapped Skills:** `agents-md`, `efficient-web-research`
* **Process / SOP:**
  1. ออกแบบโมดูล, Data Model และ Contract Interfaces (API Schema)
  2. ใช้ `efficient-web-research` สรุปคู่มือ Library/API ภายนอก โดยเลือกอ่านเฉพาะ section สำคัญเพื่อจำกัด token
  3. กำหนด boundary หน้าที่ของ agent และส่วนประกอบระบบผ่าน `agents-md`
  4. บันทึกผลการตัดสินใจทางสถาปัตยกรรม (Architecture Decision Record) สั้นๆ
* **Gate Criteria:** แบบร่าง Data Flow และ Function Signature ต้องสอดคล้องกับระบบเดิมและผ่านการตรวจสอบ compatibility

---

### Phase 3: Implementation & Development
* **Mapped Skills:** `sharp-coder`, `systematic-debugging`
* **Process / SOP:**
  1. ดำเนินการเขียนโค้ดโดยใช้ `sharp-coder` ซึ่งเน้นการแก้ไขเฉพาะจุด (Surgical Edit) ห้ามแก้ไขโค้ดที่ไม่เกี่ยวข้อง
  2. รักษา Code Style, Linting Rules และ Naming Convention ตามโครงสร้างหลัก
  3. หากพบ Error ระหว่างการรัน ให้เรียกใช้ `systematic-debugging`:
     - วิเคราะห์ Stack Trace และจำลองจุดที่เกิดข้อผิดพลาด
     - แยกแยะ Root Cause ออกจากอาการภายนอก
     - แก้ปัญหาที่ต้นเหตุ หลีกเลี่ยงการสุ่มแก้ (Trial-and-Error)
* **Gate Criteria:** ซอร์สโค้ดต้องคอมไพล์ผ่าน ไม่ติด linter errors และไม่มี warning ที่ร้ายแรง

---

### Phase 4: Testing & Quality Assurance
* **Mapped Skills:** `accint-solve`, `skill-security-audit`
* **Process / SOP:**
  1. เขียนและรัน Unit Test หรือ Integration Test ครอบคลุมเส้นทางการทำงานหลัก
  2. ใช้ `accint-solve` ตรวจเช็กผลลัพธ์ของระบบเทียบกับ Acceptance Criteria ใน Phase 1 ครบทุกข้อ
  3. ตรวจสอบความปลอดภัยด้วย `skill-security-audit`:
     - สแกนหา Hardcoded Secrets, API Keys หรือ Token
     - ตรวจสอบช่องโหว่ Input Injection (SQLi, XSS) และ Broken Access Controls
* **Gate Criteria:** Test cases ผ่านทั้งหมด (100% Pass) และไม่พบช่องโหว่ด้าน Security ระดับ Medium ขึ้นไป
