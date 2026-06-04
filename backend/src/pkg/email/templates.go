package email

import (
	"bytes"
	"fmt"
	"html/template"
	"strings"
	"time"

	"github.com/wealthy-prime/backend/src/config"
	"github.com/wealthy-prime/backend/src/database/model"
)

// BuildAppointmentNotification renders the email an agent receives when a
// customer schedules a property viewing through the cart/booking flow.
func BuildAppointmentNotification(booking *model.Booking, agent *model.User) (Message, error) {
	property := booking.Property

	// Compose the customer-facing display name from the snapshot fields
	// captured at booking time, falling back to the user's profile name.
	customerName := strings.TrimSpace(strings.Join([]string{booking.FirstName, booking.LastName}, " "))
	if customerName == "" {
		customerName = booking.User.Name
	}

	customerPhone := firstNonEmpty(booking.Phone, booking.User.Phone)
	customerEmail := firstNonEmpty(booking.Email, booking.User.Email)
	apptTime := booking.AppointmentDate.In(time.FixedZone("ICT", 7*3600)).Format("2 Jan 2006 15:04 น.")

	data := appointmentData{
		AgentName:      agent.Name,
		PropertyTitle:  property.Title,
		PropertyCode:   property.PropertyCode,
		CustomerName:   customerName,
		CustomerPhone:  customerPhone,
		CustomerEmail:  customerEmail,
		CustomerLineID: booking.LineID,
		Appointment:    apptTime,
		Note:           strings.TrimSpace(booking.Note),
		DashboardURL:   config.App.SMTP.AppURL + "/agent/contacts",
	}

	var htmlBuf, textBuf bytes.Buffer
	if err := apptHTMLTpl.Execute(&htmlBuf, data); err != nil {
		return Message{}, fmt.Errorf("render html: %w", err)
	}
	if err := apptTextTpl.Execute(&textBuf, data); err != nil {
		return Message{}, fmt.Errorf("render text: %w", err)
	}

	subject := fmt.Sprintf("[นัดชมทรัพย์] %s — %s", property.Title, apptTime)
	return Message{
		To:       agent.Email,
		ToName:   agent.Name,
		Bcc:      config.App.SMTP.NotificationBcc,
		Subject:  subject,
		HTMLBody: htmlBuf.String(),
		TextBody: textBuf.String(),
	}, nil
}

// BuildAppointmentConfirmation renders the email a CUSTOMER receives when
// they successfully schedule a property viewing — a polite confirmation of
// the booking with the assigned agent's contact details.
func BuildAppointmentConfirmation(booking *model.Booking, agent *model.User) (Message, error) {
	property := booking.Property

	customerName := strings.TrimSpace(strings.Join([]string{booking.FirstName, booking.LastName}, " "))
	if customerName == "" {
		customerName = booking.User.Name
	}
	toEmail := firstNonEmpty(booking.Email, booking.User.Email)
	if toEmail == "" {
		return Message{}, fmt.Errorf("no customer email available for booking %d", booking.ID)
	}
	apptTime := booking.AppointmentDate.In(time.FixedZone("ICT", 7*3600)).Format("2 Jan 2006 15:04 น.")

	data := confirmationData{
		CustomerName:  customerName,
		PropertyTitle: property.Title,
		PropertyCode:  property.PropertyCode,
		Appointment:   apptTime,
		AgentName:     agent.Name,
		AgentPhone:    agent.Phone,
		AgentEmail:    agent.Email,
		Note:          strings.TrimSpace(booking.Note),
		HistoryURL:    config.App.SMTP.AppURL + "/history",
	}

	var htmlBuf, textBuf bytes.Buffer
	if err := confirmHTMLTpl.Execute(&htmlBuf, data); err != nil {
		return Message{}, fmt.Errorf("render html: %w", err)
	}
	if err := confirmTextTpl.Execute(&textBuf, data); err != nil {
		return Message{}, fmt.Errorf("render text: %w", err)
	}

	subject := fmt.Sprintf("[ยืนยันนัดหมาย] %s — %s", property.Title, apptTime)
	return Message{
		To:       toEmail,
		ToName:   customerName,
		Bcc:      config.App.SMTP.NotificationBcc,
		Subject:  subject,
		HTMLBody: htmlBuf.String(),
		TextBody: textBuf.String(),
	}, nil
}

type confirmationData struct {
	CustomerName  string
	PropertyTitle string
	PropertyCode  string
	Appointment   string
	AgentName     string
	AgentPhone    string
	AgentEmail    string
	Note          string
	HistoryURL    string
}

var confirmHTMLTpl = template.Must(template.New("confirm_html").Parse(`<!doctype html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; color:#222; max-width:600px; margin:0 auto; padding:24px;">
  <h2 style="color:#1f2937;">ยืนยันการนัดชมทรัพย์</h2>
  <p>สวัสดีคุณ {{.CustomerName}},</p>
  <p>เราได้รับการนัดหมายชมทรัพย์ของคุณเรียบร้อยแล้ว รายละเอียดดังนี้:</p>
  <table cellpadding="6" style="border-collapse:collapse; font-size:14px;">
    <tr><td><strong>ทรัพย์</strong></td><td>{{.PropertyTitle}}{{if .PropertyCode}} <span style="color:#888;">(รหัส {{.PropertyCode}})</span>{{end}}</td></tr>
    <tr><td><strong>วันนัดหมาย</strong></td><td>{{.Appointment}}</td></tr>
    <tr><td><strong>ตัวแทนที่ดูแล</strong></td><td>{{.AgentName}}</td></tr>
    {{if .AgentPhone}}<tr><td><strong>เบอร์ตัวแทน</strong></td><td>{{.AgentPhone}}</td></tr>{{end}}
    {{if .AgentEmail}}<tr><td><strong>อีเมลตัวแทน</strong></td><td>{{.AgentEmail}}</td></tr>{{end}}
    {{if .Note}}<tr><td><strong>หมายเหตุ</strong></td><td>{{.Note}}</td></tr>{{end}}
  </table>
  <p style="margin-top:16px;">ตัวแทนของเราจะติดต่อกลับเพื่อยืนยันรายละเอียดเพิ่มเติม</p>
  <p style="margin-top:24px;">
    <a href="{{.HistoryURL}}" style="background:#1f2937; color:#fff; padding:10px 20px; text-decoration:none; border-radius:6px; display:inline-block;">ดูประวัติการนัดหมาย</a>
  </p>
  <hr style="margin-top:32px; border:none; border-top:1px solid #eee;">
  <p style="font-size:12px; color:#888;">อีเมลฉบับนี้ส่งจากระบบ Wealthy Prime Estate โดยอัตโนมัติ</p>
</body></html>`))

var confirmTextTpl = template.Must(template.New("confirm_text").Parse(`สวัสดีคุณ {{.CustomerName}},

เราได้รับการนัดหมายชมทรัพย์ของคุณเรียบร้อยแล้ว:

ทรัพย์: {{.PropertyTitle}}{{if .PropertyCode}} (รหัส {{.PropertyCode}}){{end}}
วันนัดหมาย: {{.Appointment}}
ตัวแทนที่ดูแล: {{.AgentName}}{{if .AgentPhone}}
เบอร์ตัวแทน: {{.AgentPhone}}{{end}}{{if .AgentEmail}}
อีเมลตัวแทน: {{.AgentEmail}}{{end}}{{if .Note}}
หมายเหตุ: {{.Note}}{{end}}

ตัวแทนของเราจะติดต่อกลับเพื่อยืนยันรายละเอียดเพิ่มเติม

ดูประวัติการนัดหมาย: {{.HistoryURL}}

— ระบบ Wealthy Prime Estate
`))

type appointmentData struct {
	AgentName      string
	PropertyTitle  string
	PropertyCode   string
	CustomerName   string
	CustomerPhone  string
	CustomerEmail  string
	CustomerLineID string
	Appointment    string
	Note           string
	DashboardURL   string
}

var apptHTMLTpl = template.Must(template.New("appt_html").Parse(`<!doctype html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; color:#222; max-width:600px; margin:0 auto; padding:24px;">
  <h2 style="color:#1f2937;">มีลูกค้านัดชมทรัพย์ใหม่</h2>
  <p>สวัสดีคุณ {{.AgentName}},</p>
  <p>มีลูกค้านัดหมายชมทรัพย์ของคุณดังนี้:</p>
  <table cellpadding="6" style="border-collapse:collapse; font-size:14px;">
    <tr><td><strong>ทรัพย์</strong></td><td>{{.PropertyTitle}}{{if .PropertyCode}} <span style="color:#888;">(รหัส {{.PropertyCode}})</span>{{end}}</td></tr>
    <tr><td><strong>วันนัดหมาย</strong></td><td>{{.Appointment}}</td></tr>
    <tr><td><strong>ชื่อลูกค้า</strong></td><td>{{.CustomerName}}</td></tr>
    {{if .CustomerPhone}}<tr><td><strong>เบอร์</strong></td><td>{{.CustomerPhone}}</td></tr>{{end}}
    {{if .CustomerEmail}}<tr><td><strong>อีเมล</strong></td><td>{{.CustomerEmail}}</td></tr>{{end}}
    {{if .CustomerLineID}}<tr><td><strong>Line ID</strong></td><td>{{.CustomerLineID}}</td></tr>{{end}}
    {{if .Note}}<tr><td><strong>หมายเหตุ</strong></td><td>{{.Note}}</td></tr>{{end}}
  </table>
  <p style="margin-top:24px;">
    <a href="{{.DashboardURL}}" style="background:#1f2937; color:#fff; padding:10px 20px; text-decoration:none; border-radius:6px; display:inline-block;">ดูใน Dashboard</a>
  </p>
  <hr style="margin-top:32px; border:none; border-top:1px solid #eee;">
  <p style="font-size:12px; color:#888;">อีเมลฉบับนี้ส่งจากระบบ Wealthy Prime Estate โดยอัตโนมัติ</p>
</body></html>`))

var apptTextTpl = template.Must(template.New("appt_text").Parse(`สวัสดีคุณ {{.AgentName}},

มีลูกค้านัดหมายชมทรัพย์ของคุณ:

ทรัพย์: {{.PropertyTitle}}{{if .PropertyCode}} (รหัส {{.PropertyCode}}){{end}}
วันนัดหมาย: {{.Appointment}}
ชื่อลูกค้า: {{.CustomerName}}{{if .CustomerPhone}}
เบอร์: {{.CustomerPhone}}{{end}}{{if .CustomerEmail}}
อีเมล: {{.CustomerEmail}}{{end}}{{if .CustomerLineID}}
Line ID: {{.CustomerLineID}}{{end}}{{if .Note}}
หมายเหตุ: {{.Note}}{{end}}

ดูรายละเอียดเพิ่มเติม: {{.DashboardURL}}

— ระบบ Wealthy Prime Estate
`))

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if s := strings.TrimSpace(v); s != "" {
			return s
		}
	}
	return ""
}
