import { useEffect, useState } from 'react';
import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client'
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Head from 'next/head';
import Link from 'next/link';
import { FiUser, FiCalendar } from 'react-icons/fi'

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const[posts, setPosts] = useState<PostPagination>(postsPagination)

  async function handleLoadMorePosts() {
    await fetch(posts.next_page)
      .then(response => response.json())
      .then(data => setPosts({
        next_page: data.next_page,
        results: [...posts.results, ...data.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: format(new Date(post.last_publication_date), 'd MMM yyyy ', {locale: ptBR}),
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            }
          }
        })]
      }))
  }

  return(
   <>
    <Head>
      <title>Home | Spacetraveling</title>
    </Head>
    <main className={commonStyles.container}>
      <div className={styles.logo}>
        <img src="/images/logo.svg" alt="logo" />
      </div>
      <div className={styles.posts}>
        {posts.results.map(post => (
          <Link href={`/post/${post.uid}`}>
          <a key={post.uid}>
            <div>
              <h1>{post.data.title}</h1>
              <p>{post.data.subtitle}</p>
            </div>
            <div>
            <div>
              <FiCalendar />
              <time>{post.first_publication_date}</time>
            </div>
            <div>
              <FiUser />
              <p>{post.data.author}</p>
            </div>
            </div>
          </a>
          </Link>
        ))}
      </div>
      {posts.next_page && 
        <div className={styles.loadMorePosts}>
          <button type="button" onClick={handleLoadMorePosts}>Carregar mais posts</button>
        </div>
      }
    </main>
    </>
 )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.Predicates.at('document.type', 'post')
  ], {
    fetch: ['post.title', 'post.subtitle', 'post.author'],
    pageSize: 1,
    page: 1
    }
  )

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: format(new Date(post.last_publication_date), 'dd MMM yyyy ', {locale: ptBR}),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    }
  })

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: posts
  }

  return {
    props: {
      postsPagination
    },
    revalidate: 60 * 60
  }
}
