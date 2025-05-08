import neo4j, { Driver } from 'neo4j-driver';

let driver: Driver | null = null;

export function getNeo4jDriver() {
  if (!driver) {
    if (!process.env.NEXT_PUBLIC_NEO4J_URI || 
        !process.env.NEXT_PUBLIC_NEO4J_USERNAME || 
        !process.env.NEXT_PUBLIC_NEO4J_PASSWORD) {
      throw new Error('Neo4j environment variables are not properly configured');
    }

    try {
      driver = neo4j.driver(
        process.env.NEXT_PUBLIC_NEO4J_URI,
        neo4j.auth.basic(
          process.env.NEXT_PUBLIC_NEO4J_USERNAME,
          process.env.NEXT_PUBLIC_NEO4J_PASSWORD
        ),
        {
          maxConnectionPoolSize: 10,
          connectionTimeout: 30000,
          maxTransactionRetryTime: 30000
        }
      );

      // Test the connection
      driver.verifyConnectivity()
        .then(() => {
          console.log('Successfully connected to Neo4j database');
        })
        .catch((error) => {
          console.error('Failed to connect to Neo4j:', error);
          driver = null;
          throw error;
        });
    } catch (error) {
      console.error('Failed to create Neo4j driver:', error);
      throw error;
    }
  }
  return driver;
}

export async function executeQuery(cypher: string, params = {}, signal?: AbortSignal) {
  const driver = getNeo4jDriver();
  const session = driver.session({
    defaultAccessMode: neo4j.session.WRITE,
    database: 'neo4j'
  });

  try {
    if (signal) {
      if (signal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      
      const abortPromise = new Promise((_, reject) => {
        signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        }, { once: true });
      });

      const result = await Promise.race([
        session.run(cypher, params),
        abortPromise
      ]);

      return result.records.map(record => {
        const obj: any = {};
        record.keys.forEach(key => {
          obj[key] = record.get(key);
        });
        return obj;
      });
    } else {
      const result = await session.run(cypher, params);
      return result.records.map(record => {
        const obj: any = {};
        record.keys.forEach(key => {
          obj[key] = record.get(key);
        });
        return obj;
      });
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    console.error('Query execution error:', error);
    throw new Error(`Failed to execute Neo4j query: ${error.message}`);
  } finally {
    await session.close();
  }
}

export async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}