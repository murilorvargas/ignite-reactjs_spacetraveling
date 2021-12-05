import { GetStaticPaths, GetStaticProps } from 'next';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client'
import { getPrismicClient } from '../../services/prismic';
import { RichText } from 'prismic-dom';
import Head from 'next/head';
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi'
import { useRouter } from 'next/router'

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps){
  const router = useRouter()
  
  if (router.isFallback) {
    return <div className={styles.loading}>Carregando...</div>
  }

  const pageReadingTime = Math.ceil(
    post.data.content.reduce((total, contentItem) => {
      const heading = String(contentItem.heading).split(' ');
      const body = RichText.asText(contentItem.body).split(' ');
      return total + (body.length + heading.length);
    }, 0) / 200
  );

  return (
    <>
      <Head>
        <title>Post | Spacetraveling</title>
      </Head>
      <Header />
      <img src={post.data.banner.url} alt="banner" className={styles.banner}/>
      <main className={commonStyles.container}>
        <div className={styles.content}>
          <h1>{post.data.title}</h1>
          <div>
            <div>
              <FiCalendar />
              <time>{format(new Date(post.first_publication_date), 'dd MMM yyyy ', {locale: ptBR})}</time>
            </div>
            <div>
              <FiUser />
              <p>{post.data.author}</p>
            </div>
            <div>
              <FiClock />
              <p>{pageReadingTime} min</p>
            </div>
          </div>
          <article>
          {post.data.content.map(content => (
            <>
              <strong>{content.heading}</strong>
              <div dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body) }} />
            </>
          ))}
          </article>
        </div>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query([
    Prismic.predicates.at('document.type', 'post')
  ], {
    pageSize: 1
  })

  return {
    paths: response.results.map((post) => {
      return (
        { params: { slug: post.uid } }
      )
    }),
    fallback: true
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();   
  const response = await prismic.getByUID(`post`, String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    }
  }

  return {
    props: {
      post,
    },
    revalidate: 60 * 60
  }
 };
