// Configurações globais para testes
process.env.NODE_ENV = 'test';

// Silenciar logs durante testes
const originalLog = console.log;
const originalError = console.error;

beforeAll(() => {
    console.log = jest.fn();
    console.error = jest.fn();
});

afterAll(() => {
    console.log = originalLog;
    console.error = originalError;
});

// Timeout global para testes
jest.setTimeout(10000); 