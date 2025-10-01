# 🚀 Advanced Document Processing System

## Overview

This is a sophisticated document processing system that connects your React platform with a Python FastAPI service for advanced document generation and processing.

## 🏗️ Architecture

```
React Platform (Port 3000) ←→ FastAPI Service (Port 8000) ←→ Supabase Database
```

### Components:
1. **React Frontend** - Your existing vessel platform
2. **FastAPI Service** - Python document processing service
3. **Supabase Database** - Template storage and vessel data
4. **Document Processor** - Enhanced Python document processing

## 🚀 Quick Start

### 1. Install Python Dependencies

```bash
cd autofill
pip install -r requirements.txt
```

### 2. Setup Environment Variables

Make sure your `.env` file contains:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
FLASK_SECRET_KEY=your-secret-key-here
```

### 3. Run Database Migration

```bash
# In your main project directory
supabase db push
```

### 4. Start the FastAPI Service

```bash
cd autofill
python start_services.py
```

The service will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### 5. Start Your React Platform

```bash
# In your main project directory
npm run dev
```

Your React app will be available at: http://localhost:3000

## 📋 Features

### Admin Panel - Template Management
- **Upload Templates**: Upload .docx files with placeholders
- **Template Library**: View and manage all templates
- **Placeholder Mapping**: Configure how placeholders map to database fields
- **Test Templates**: Test templates with real vessel data

### Vessel Detail Page - Document Generation
- **Template Selection**: Choose from available templates
- **Real-time Processing**: Process documents with live vessel data
- **Multiple Formats**: Download as Word (.docx) or PDF
- **Status Tracking**: Real-time processing status updates

### API Endpoints
- `GET /templates` - Get all available templates
- `GET /vessels` - Get all vessels from database
- `POST /process-document` - Process a document with vessel data
- `GET /download/{document_id}` - Download processed document
- `GET /vessel/{vessel_imo}` - Get specific vessel data

## 🔧 Configuration

### Template Placeholders

Templates support these placeholders:
- `{vessel_name}` - Vessel name
- `{imo}` - IMO number
- `{vessel_type}` - Type of vessel
- `{flag}` - Flag state
- `{owner}` - Owner name
- `{operator}` - Operator name
- `{length}` - Vessel length
- `{width}` - Vessel width
- `{tonnage}` - Deadweight tonnage
- `{current_date}` - Current date
- `{current_time}` - Current time

### Database Tables

#### `document_templates`
- Stores template files and metadata
- Placeholder mappings
- Active/inactive status

#### `processed_documents`
- Tracks document processing jobs
- Stores processing status and logs
- Links to templates and vessels

## 🎯 Usage Workflow

### For Administrators:
1. Go to **Admin Panel → Templates**
2. Upload a new .docx template
3. Configure placeholder mappings
4. Test with real vessel data
5. Activate template for use

### For Users:
1. Go to **Vessel Detail Page**
2. Scroll to **Vessel Documents** section
3. Select a template
4. Click **Generate** to process
5. Download the filled document

## 🔍 API Documentation

Visit http://localhost:8000/docs for interactive API documentation.

### Example API Call:

```javascript
// Process a document
const formData = new FormData();
formData.append('template_id', 'template-123');
formData.append('vessel_imo', 'IMO1234567');
formData.append('template_file', file);

const response = await fetch('http://localhost:8000/process-document', {
  method: 'POST',
  body: formData
});

const result = await response.json();
if (result.success) {
  // Download the processed document
  window.open(`http://localhost:8000/download/${result.document_id}`, '_blank');
}
```

## 🛠️ Development

### Adding New Placeholders

1. Update the `RandomDataGenerator` class in `random_data_generator.py`
2. Add the placeholder to your templates
3. Configure mapping in the admin panel

### Customizing Document Processing

Modify `enhanced_document_processor.py` to:
- Add new data sources
- Customize placeholder replacement logic
- Add new output formats

### Extending the API

Add new endpoints in `fastapi_service.py`:
- New processing methods
- Additional data sources
- Custom validation logic

## 🚨 Troubleshooting

### Common Issues:

1. **Service Not Starting**
   - Check if port 8000 is available
   - Verify all dependencies are installed
   - Check environment variables

2. **Database Connection Issues**
   - Verify Supabase credentials
   - Check network connectivity
   - Ensure database tables exist

3. **Document Processing Fails**
   - Check template file format (.docx only)
   - Verify vessel IMO exists in database
   - Check processing logs

4. **CORS Issues**
   - Update CORS settings in `fastapi_service.py`
   - Ensure React app URL is allowed

### Logs and Debugging:

- FastAPI service logs: Check terminal output
- React app logs: Check browser console
- Database logs: Check Supabase dashboard

## 🔒 Security Considerations

- API endpoints are not authenticated (add authentication for production)
- File uploads are validated for .docx format only
- Temporary files are cleaned up after processing
- CORS is configured for development (restrict for production)

## 🚀 Production Deployment

### FastAPI Service:
- Use a production WSGI server (Gunicorn)
- Set up reverse proxy (Nginx)
- Configure SSL/TLS
- Add authentication middleware

### React Platform:
- Build for production
- Deploy to CDN or static hosting
- Configure environment variables
- Update API endpoints

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation at `/docs`
3. Check service health at `/health`
4. Review logs for error details

---

**🎉 Your advanced document processing system is now ready!**
