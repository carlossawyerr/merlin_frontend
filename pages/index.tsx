import React, { useState, useEffect } from 'react';

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [stitchedVideoUrl, setStitchedVideoUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const generateFolderName = () => {
    const randomString = Math.random().toString(36).substring(2, 8);
    const date = new Date();
    const estTime = date.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const formattedTime = estTime.replace(',', '').replace(/:/g, '').replace(/\//g, '').replace(' ', '');
    return `${randomString}_${formattedTime}`;
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert('Please select file(s) to upload');
      return;
    }
    setUploading(true);
    const newFolderName = generateFolderName();
    setFolderName(newFolderName);
    try {
      for (const file of files) {
        const { name, type } = file;
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, type, folderName: newFolderName }),
        });
        const { url } = await res.json();
        await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': type,
          },
          body: file,
        });
      }
      alert('Upload successful!');
      checkForStitchedVideo(newFolderName);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
      setFiles([]);
    }
  };

  const checkForStitchedVideo = async (folderName: string) => {
    try {
      const response = await fetch(`/api/check-stitched-video?folderName=${folderName}`);
      const data = await response.json();

      if (data.available) {
        setStitchedVideoUrl(data.url);
      } else {
        // Check again after 30 seconds
        setTimeout(() => checkForStitchedVideo(folderName), 30000);
      }
    } catch (error) {
      console.error('Error checking for stitched video:', error);
    }
  };

  useEffect(() => {
    if (folderName) {
      checkForStitchedVideo(folderName);
    }
  }, [folderName]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Upload Files</h1>
        <div className="mb-4">
          <label htmlFor="file-upload" className="block mb-2 text-sm font-medium text-gray-700">
            Choose video and text files
          </label>
          <input
            id="file-upload"
            type="file"
            accept="video/*,text/*"
            multiple
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>
        <div className="text-sm text-gray-500 mb-4 text-center">
          {files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'No file chosen'}
        </div>
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload Files'}
        </button>
        {folderName && (
          <div className="mt-4 text-sm text-blue-500 text-center">
            Files have been uploaded to folder: {folderName}
          </div>
        )}
        {stitchedVideoUrl && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Stitched Video</h2>
            <video controls className="w-full">
              <source src={stitchedVideoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        )}
        {folderName && !stitchedVideoUrl && (
          <div className="mt-4 text-sm text-blue-500 text-center">
            Waiting for stitched video... This may take a few minutes.
          </div>
        )}
      </div>
    </div>
  );
}