# Document Sharing Rules & Permissions

## 📋 Access Control Rules

### ✅ **All Roles Can:**
- **Share documents** - Upload and share documents with other users
- **View documents** - See documents they have access to

### 👤 **Members Can:**
- **View:** Documents they shared OR documents shared with them
- **Manage:** Only documents they created/shared
  - ✅ Can update sharing settings for their own documents
  - ✅ Can delete their own documents
  - ❌ **Cannot delete** documents shared by others (original files protected)
  - ❌ Cannot modify documents shared with them (read-only access)

### 👨‍💼 **Admins Can:**
- **View:** All documents in the system
- **Manage:** Full control over all documents
  - ✅ Can update sharing settings for any document
  - ✅ Can delete any document (including those shared by members)
  - ✅ Can see all sharing relationships

### 🔐 **Super Admins Can:**
- **View:** All documents in the system
- **Manage:** Full control over all documents
  - ✅ Can update sharing settings for any document
  - ✅ Can delete any document (including those shared by members)
  - ✅ Can see all sharing relationships
  - ✅ Full audit log access

---

## 🔒 Security Features

### **Original File Protection**
- Members **cannot delete** documents shared by others
- Only the original creator or Admin/SuperAdmin can delete
- Prevents accidental or malicious deletion of shared content

### **Audit Logging**
All document actions are logged for traceability and compliance:

- ✅ **SHARE_DOCUMENT** - When a document is shared
  - Logs: document ID, title, URL, who it's shared with
- ✅ **UPDATE_DOCUMENT_SHARES** - When sharing settings change
  - Logs: document ID, previous shares, new shares
- ✅ **DELETE_DOCUMENT** - When a document is deleted
  - Logs: document ID, who deleted it, original owner

**Audit logs include:**
- User who performed the action
- Timestamp
- Document details (ID, title, URL)
- Sharing information
- Role of the user performing the action

---

## 📊 Permission Matrix

| Action | Member (Own) | Member (Shared With) | Admin | SuperAdmin |
|--------|--------------|---------------------|-------|------------|
| **View Document** | ✅ | ✅ | ✅ | ✅ |
| **Share Document** | ✅ | ✅ | ✅ | ✅ |
| **Update Own Shares** | ✅ | ❌ | ✅ | ✅ |
| **Update Others' Shares** | ❌ | ❌ | ✅ | ✅ |
| **Delete Own Document** | ✅ | ❌ | ✅ | ✅ |
| **Delete Others' Document** | ❌ | ❌ | ✅ | ✅ |
| **View All Documents** | ❌ | ❌ | ✅ | ✅ |

---

## 🎯 Use Cases

### **Scenario 1: Member Shares Document**
1. Member creates and shares a document with 3 other members
2. Those 3 members can view and access the document
3. Only the original member can modify sharing or delete
4. Other members have read-only access

### **Scenario 2: Admin Manages All Documents**
1. Admin can see all documents in the system
2. Admin can modify sharing settings for any document
3. Admin can delete any document (with confirmation)
4. All actions are logged in audit logs

### **Scenario 3: Member Tries to Delete Others' Document**
1. Member sees a document shared with them
2. Member tries to delete it
3. System prevents deletion with message: "Bạn chỉ có thể xóa tài liệu do chính mình chia sẻ"
4. Original file is protected

---

## 🔍 Audit Trail

Every document action is logged with:
- **Who:** User ID, email, role
- **What:** Action type (SHARE, UPDATE, DELETE)
- **When:** Timestamp
- **Details:** Document info, sharing info, changes made

**Compliance Benefits:**
- ✅ Full traceability of document access
- ✅ Compliance with data protection regulations
- ✅ Ability to track who shared what with whom
- ✅ Deletion history for audit purposes

---

## ✅ Implementation Status

All rules are now implemented:

- ✅ All roles can share and view documents
- ✅ Members can manage only their own shares
- ✅ Admins and SuperAdmins have full control
- ✅ Original files protected from deletion by members
- ✅ Audit logs ensure traceability and compliance

---

## 🚀 Ready to Use!

The document sharing system now enforces all security rules. Test it by:
1. Sharing a document as a member
2. Trying to delete someone else's document (should be blocked)
3. Checking audit logs to see all actions recorded
