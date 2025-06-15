"use client";

import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebaseconfig';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia, 
  Grid, 
  Button,
  Modal,
  Box,
  IconButton,
  Link as MuiLink
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Link from 'next/link'; 

const AllPosts = () => {
  const [Posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [open, setOpen] = useState(false);

  const fetchUserName = async (userId) => {
    try {
      // First, try to fetch the user document using the userId as the document ID
      let userDoc = await getDoc(doc(db, 'users', userId));
      
      if (!userDoc.exists()) {
        // If not found, query the users collection to find a document where uid matches userId
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', '==', userId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          userDoc = querySnapshot.docs[0];
        } else {
          return 'Unknown User';
        }
      }
      
      return userDoc.data().name;
    } catch (error) {
      console.error("Error fetching user data: ", error);
      return 'Unknown User';
    }
  };

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const PostCollection = collection(db, 'posts');
        const Postsnapshot = await getDocs(PostCollection);
        const PostList = Postsnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const PostsWithUserNames = await Promise.all(PostList.map(async (Post) => {
          const userName = await fetchUserName(Post.userId);
          return {
            ...Post,
            userName
          };
        }));

        setPosts(PostsWithUserNames);
      } catch (error) {
        console.error("Error fetching Posts: ", error);
      }
    };

    fetchPosts();
  }, []);

  const handleReadMore = (Post) => {
    setSelectedPost(Post);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedPost(null);
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    maxWidth: 800,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    maxHeight: '90vh',
    overflow: 'auto',
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
    <Typography variant="h4" component="h1" gutterBottom>
      All Posts
    </Typography>
    <Grid container spacing={4}>
      {Posts.map((Post) => (
        <Grid item key={Post.id} xs={12} sm={6} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {Post.imageUrls && Post.imageUrls.length > 0 && (
              <CardMedia
                component="img"
                sx={{ height: 200 }}
                image={Post.imageUrls[0]}
                alt={Post.title || 'Post image'}
              />
            )}
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h2">
                  {Post.title}
                </Typography>
                <Typography>
                  {Post.content.substring(0, 100)}...
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                By: <Link href={`/user/${Post.userId}`} passHref legacyBehavior>
                    <MuiLink color="inherit" underline="hover">{Post.userName}</MuiLink>
                  </Link>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Posted on: {new Date(Post.createdAt).toLocaleDateString()}
                </Typography>
                <Button 
                  size="small" 
                  onClick={() => handleReadMore(Post)}
                  sx={{ mt: 2 }}
                >
                  Read More
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={modalStyle}>
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
          {selectedPost && (
            <>
              <Typography id="modal-modal-title" variant="h6" component="h2">
                {selectedPost.title}
              </Typography>
              {selectedPost.imageUrls && (
                <Box sx={{ my: 2 }}>
                  <img src={selectedPost.imageUrls} alt={selectedPost.title} style={{ maxWidth: '100%' }} />
                </Box>
              )}
              <Typography id="modal-modal-description" sx={{ mt: 2, whiteSpace: 'pre-wrap', fontFamily: selectedPost.font || 'inherit' }}>
                {selectedPost.content}
              </Typography>
              <Box sx={{ mt: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  By: {selectedPost.userName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Posted on: {new Date(selectedPost.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </Container>
  );
};

export default AllPosts;