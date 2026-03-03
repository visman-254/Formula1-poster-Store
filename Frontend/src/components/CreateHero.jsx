// src/components/CreateHero.jsx

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { createHeroSlide, getFullHeroSlides, deleteHeroSlide, toggleHeroSlideStatus, updateHeroSlide } from '../api/heroslide.js'; 
import { getCategories } from '../api/product.js';
import { Upload, X, CheckCircle, Trash2, ToggleLeft, ToggleRight, Edit2, Save } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const CreateHero = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [slides, setSlides] = useState([]); 
  const [editingSlide, setEditingSlide] = useState(null);

  const titleRef = useRef(null);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch slides
  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      const data = await getFullHeroSlides();
      setSlides(data);
    } catch (err) {
      console.error("Failed to load slides", err);
    }
  };

  
  const onDrop = useCallback(acceptedFiles => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setMessage(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
    },
    multiple: false,
  });

  // Submit new slide
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!title || !description || !file) {
      setMessage({ type: 'error', text: 'Please fill in all fields and upload an image.' });
      return;
    }

    setLoading(true);

    try {
      const heroSlideData = { 
        title, 
        description, 
        category_id: categoryId || null,
        image: file 
      };
      const response = await createHeroSlide(heroSlideData);

      setMessage({ type: 'success', text: `Slide created successfully with ID: ${response.slide.id}` });
      setTitle('');
      setDescription('');
      setCategoryId('');
      setFile(null);
      setPreviewUrl('');

      fetchSlides();   
      
      if (titleRef.current) titleRef.current.focus();

    } catch (err) {
      console.error("Hero Slide Creation Error:", err);
      const errMsg = err.response?.data?.error || 'Failed to create slide. Check server logs.';
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this slide?")) return;
    try {
      await deleteHeroSlide(id);
      setSlides(prev => prev.filter(slide => slide.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleToggle = async (id, status) => {
    try {
      const newStatus = status === "active" ? "inactive" : "active";
      await toggleHeroSlideStatus(id, newStatus);
      setSlides(prev =>
        prev.map(slide =>
          slide.id === id ? { ...slide, status: newStatus } : slide
        )
      );
    } catch (err) {
      console.error("Toggle status error:", err);
    }
  };

  const handleEdit = (slide) => {
    setEditingSlide({
      id: slide.id,
      title: slide.title,
      description: slide.description || '',
      category_id: slide.category_id || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSlide.title || !editingSlide.description) {
      setMessage({ type: 'error', text: 'Title and description are required.' });
      return;
    }

    setLoading(true);
    try {
      await updateHeroSlide(editingSlide.id, {
        title: editingSlide.title,
        description: editingSlide.description,
        category_id: editingSlide.category_id || null
      });
      
      setMessage({ type: 'success', text: 'Slide updated successfully!' });
      setEditingSlide(null);
      fetchSlides();
    } catch (err) {
      console.error("Update error:", err);
      setMessage({ type: 'error', text: 'Failed to update slide.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingSlide(null);
  };

  const StatusMessage = ({ type, text }) => (
    <div className={`status-message ${type === 'success' ? 'text-green-500' : 'text-red-500'} flex items-center gap-2`}>
      {type === 'success' ? <CheckCircle size={20} /> : <X size={20} />}
      {text}
    </div>
  );

  return (
    <Card className="font-sans bg-glass min-h-screen p-4">
      <CardHeader>
        <CardTitle>Create New Hero Slide</CardTitle>
        <CardDescription>Add a new hero slide to the homepage carousel.</CardDescription>
      </CardHeader>
      <CardContent>
        {message && <StatusMessage {...message} />}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Image */}
          <div className="space-y-2">
            <Label>Image</Label>
            {previewUrl ? (
              <div className="relative">
                <img src={previewUrl} alt="Hero Slide Preview" className="rounded-md w-full" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2"
                >
                  <X size={20} />
                </Button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-md p-12 text-center cursor-pointer ${isDragActive ? 'border-primary' : 'border-border'}`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">Drag 'n' drop an image here, or click to select file (JPG/PNG)</p>
                <p className="mt-1 text-xs text-muted-foreground">The image should be landscape orientation.</p>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Summer Sale"
              required
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional Tagline)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short, catchy description for the slide."
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Link to Category (Optional)</Label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
              disabled={loading}
            >
              <option value="">No category link</option>
              {categories.map(cat => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.category_name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">When users click the hero image, they'll be directed to this category.</p>
          </div>

          <Button type="submit" disabled={loading || !title || !description || !file} className="text-white">
            {loading ? 'Uploading...' : 'Save Hero Slide'}
          </Button>
        </form>
      </CardContent>

      {/* Slides List */}
      <CardFooter className="flex-col items-start w-full space-y-4">
        <h3 className="font-bold text-lg">Existing Hero Slides</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {slides.map(slide => (
            <div key={slide.id} className="border rounded-md p-4 relative">
              {editingSlide?.id === slide.id ? (
                // Edit Mode
                <div className="space-y-3">
                  <Input
                    value={editingSlide.title}
                    onChange={(e) => setEditingSlide({...editingSlide, title: e.target.value})}
                    placeholder="Title"
                  />
                  <Textarea
                    value={editingSlide.description}
                    onChange={(e) => setEditingSlide({...editingSlide, description: e.target.value})}
                    placeholder="Description"
                    rows={2}
                  />
                  <select
                    value={editingSlide.category_id}
                    onChange={(e) => setEditingSlide({...editingSlide, category_id: e.target.value})}
                    className="w-full p-2 border rounded-md bg-background text-sm"
                  >
                    <option value="">No category link</option>
                    {categories.map(cat => (
                      <option key={cat.category_id} value={cat.category_id}>
                        {cat.category_name}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveEdit} disabled={loading}>
                      <Save size={16} className="mr-1" /> Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <img src={slide.image_url} alt={slide.title} className="w-full h-32 object-cover rounded-md mb-2" />
                  <h4 className="font-semibold">{slide.title}</h4>
                  <p className="text-sm text-muted-foreground">{slide.description}</p>
                  {slide.category_name && (
                    <p className="text-xs text-blue-500">Category: {slide.category_name}</p>
                  )}
                  <p className="text-xs mt-1">Status: 
                    <span className={slide.status === "active" ? "text-green-600" : "text-gray-500"}> {slide.status}</span>
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(slide)}
                    >
                      <Edit2 size={16} className="mr-1" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(slide.id, slide.status)}
                      className='text-white hover:text-white'
                    >
                      {slide.status === "active" ? <ToggleRight size={18} className='text-white'/> : <ToggleLeft size={18} className='text-white'/>} Toggle
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(slide.id)}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
};

export default CreateHero;
