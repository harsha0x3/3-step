import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function FAQPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-center">
        Laptop Distribution System - FAQ
      </h1>
      <ScrollArea className="h-[85vh] pr-4">
        <FAQSection
          title="Registration Officer FAQs"
          faqs={registrationOfficerFaqs}
        />
        <Separator className="my-8" />
        <FAQSection title="Store Agent FAQs" faqs={storeAgentFaqs} />
        <Separator className="my-8" />
        <FAQSection title="Common FAQs for Both Roles" faqs={commonFaqs} />
      </ScrollArea>
    </div>
  );
}

function FAQSection({ title, faqs }) {
  return (
    <Card className="mb-10 shadow-md">
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold mb-4">{title}</h2>
        <Accordion type="multiple" className="space-y-3">
          {faqs.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="whitespace-pre-line">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

const registrationOfficerFaqs = [
  {
    q: "How do I log in to the system?",
    a: "Use your registered mobile number and password. Enter the 6-digit OTP sent to your mobile. Contact admin if you haven't received login credentials.",
  },
  {
    q: "What should I do on first login?",
    a: "Change your default password, choose a strong one, and save it securely.",
  },
  {
    q: "I forgot my password. How do I reset it?",
    a: "Click 'Forgot Password', enter mobile number, and reset using OTP.",
  },
  {
    q: "How do I add a new beneficiary?",
    a: "Navigate to Add Beneficiary, fill all required fields, assign a store, upload photos, and save.",
  },
  {
    q: "What information is mandatory for beneficiary registration?",
    a: "Employee ID, Full Name, Mobile Number, Aadhaar Number, Store Assignment, Vendor Contact Person, Beneficiary Photo, Aadhaar Photo.",
  },
  {
    q: "How do I capture/upload beneficiary photos?",
    a: "Use Capture Photo or upload from device. Ensure clarity and lighting.",
  },
  {
    q: "Can I edit beneficiary details after adding them?",
    a: "Yes, unless voucher is issued. Some fields become restricted.",
  },
  {
    q: "What does 'Issue Voucher' mean?",
    a: "It marks beneficiary verified and generates voucher code.",
  },
  {
    q: "What should I verify before issuing a voucher?",
    a: "Verify all details, photos, store assignment, vendor person, and the Verified checkbox.",
  },
  {
    q: "Can I issue a voucher without photos?",
    a: "No. Both photos are mandatory.",
  },
  {
    q: "What happens after I issue a voucher?",
    a: "Voucher code is generated and beneficiary can collect laptop.",
  },
  {
    q: "Can I edit after voucher issuance?",
    a: "Only super admin can modify afterward.",
  },
  { q: "How do I search for a beneficiary?", a: "Use search bar or filters." },
  {
    q: "How do I view all beneficiaries I've registered?",
    a: "Go to All Beneficiaries and apply filters.",
  },
  {
    q: "What does 'Voucher Issued' mean?",
    a: "Beneficiary is verified and ready for laptop collection.",
  },
  { q: "Can I see issued laptops?", a: "Yes, filter by Laptop Issue Status." },
  {
    q: "How do I add vendor contact?",
    a: "Go to Vendor Contact section and add new.",
  },
  {
    q: "What if vendor contact is missing?",
    a: "Use Add New button near field.",
  },
  {
    q: "Photo upload failing?",
    a: "Ensure size <5MB, check internet, try Capture option.",
  },
  {
    q: "I made an error. How to correct?",
    a: "Edit if voucher not issued; else contact super admin.",
  },
  { q: "Can I delete beneficiary?", a: "No. Contact admin for duplicates." },
  { q: "Issued voucher mistakenly?", a: "Contact super admin immediately." },
];

const storeAgentFaqs = [
  {
    q: "How do I log in?",
    a: "Use credentials, enter OTP, contact admin if needed.",
  },
  { q: "First login steps?", a: "Change password and explore dashboard." },
  { q: "Forgot password?", a: "Use Forgot Password and OTP flow." },
  {
    q: "How do I verify a beneficiary?",
    a: "Enter voucher code, capture live photo, input Aadhaar number, system verifies.",
  },
  {
    q: "Documents required?",
    a: "Aadhaar card, voucher code, mobile for OTP.",
  },
  {
    q: "Verification steps?",
    a: "Voucher validation, Aadhaar match, facial recognition, OTP verification.",
  },
  {
    q: "Facial recognition fails?",
    a: "Fix lighting, remove obstructions, retry, or override with reason.",
  },
  {
    q: "Aadhaar mismatch?",
    a: "Recheck number, verify card, override if needed.",
  },
  {
    q: "What is override?",
    a: "Allows proceeding with justified reason when verification fails.",
  },
  {
    q: "When to use override?",
    a: "Bad lighting, technical issues, clear identity but system fails.",
  },
  {
    q: "Override reasons?",
    a: "Damaged Aadhaar, manual verification, camera issues, custom reason.",
  },
  {
    q: "How OTP works?",
    a: "System sends OTP to beneficiary; enter to proceed.",
  },
  { q: "No OTP received?", a: "Wait, resend, check mobile number/network." },
  { q: "Send OTP to admin?", a: "Yes, if beneficiary has mobile issues." },
  { q: "OTP validity?", a: "20 minutes." },
  {
    q: "Laptop issuance details needed?",
    a: "Serial number, issuer name/mobile, photos, receipt.",
  },
  { q: "How to capture photos?", a: "Capture or upload from device." },
  {
    q: "What is laptop serial?",
    a: "Unique identifier on bottom or packaging.",
  },
  { q: "Enter my details each time?", a: "No, saved after first time." },
  {
    q: "Beneficiary with laptop photo?",
    a: "Beneficiary holding laptop clearly visible.",
  },
  { q: "Wrong serial entered?", a: "Contact admin immediately." },
  { q: "What is offline upload?", a: "Bulk upload issuances done offline." },
  {
    q: "How to use offline upload?",
    a: "Download template, fill serials and details, upload back.",
  },
  { q: "Accepted formats?", a: "CSV or Excel template." },
  { q: "Failed upload records?", a: "Shown separately; fix and re-upload." },
  {
    q: "What is product upgrade?",
    a: "Beneficiary pays difference for higher model.",
  },
  {
    q: "Processing upgrade?",
    a: "Enter voucher, verify old serial, enter new laptop details.",
  },
  {
    q: "Upgrade requirements?",
    a: "Voucher code, old & new serials, price difference.",
  },
  {
    q: "How to view store beneficiaries?",
    a: "Go to Store Beneficiaries section.",
  },
  { q: "Past issuances?", a: "View on dashboard or open beneficiary record." },
  { q: "Check issuance later?", a: "Search and click View." },
  {
    q: "Camera not working?",
    a: "Check browser permissions, refresh, or upload file.",
  },
  { q: "Verification slow?", a: "Check internet, lighting, refresh." },
  {
    q: "Issued laptop to wrong person?",
    a: "Stop and contact admin immediately.",
  },
  {
    q: "Beneficiary not assigned to store?",
    a: "They belong to another store; verify voucher.",
  },
  { q: "Dummy testing allowed?", a: "No, real data only." },
  { q: "Before shift?", a: "Check internet, camera, pending issuances." },
  { q: "Handling data?", a: "Keep Aadhaar private, don't share codes." },
  { q: "What documents to keep?", a: "Bills, serial numbers, upload logs." },
  { q: "Technical issues?", a: "Troubleshoot or contact admin." },
];

const commonFaqs = [
  { q: "Supported browsers?", a: "Chrome, Firefox, Safari, Edge." },
  { q: "Mobile support?", a: "Yes, fully responsive with camera access." },
  { q: "Enable camera?", a: "Browser prompts; allow when asked." },
  {
    q: "Strong password rules?",
    a: "8+ chars, upper+lowercase, numbers, symbols.",
  },
  { q: "Share credentials?", a: "Never share your login details." },
  { q: "Data security?", a: "Encrypted, Aadhaar hashed, role-based access." },
  {
    q: "Where is documentation?",
    a: "This FAQ, tooltips, and admin resources.",
  },
  { q: "Report bugs?", a: "Send errors, steps, and screenshots to admin." },
];
