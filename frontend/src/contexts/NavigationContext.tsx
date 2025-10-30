import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
  useEffect, // Importado para o efeito de sincronia
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

/**
 * @type NavigationContextType
 * @description Define os contextos de navegação permitidos na aplicação.
 */
export type NavigationContextType = 'VENDAS' | 'FILA' | 'GESTAO';

/**
 * @interface NavigationContextData
 * @description Define a estrutura de dados exposta pelo NavigationContext.
 */
interface NavigationContextData {
  /** O contexto de navegação atualmente ativo (VENDAS, FILA, ou GESTAO). */
  activeContext: NavigationContextType;
  /**
   * @function setActiveContext
   * @description Função para definir o contexto ativo e navegar para a rota correspondente.
   * @param context O novo contexto para ativar.
   */
  setActiveContext: (context: NavigationContextType) => void;
  /** Lista de contextos disponíveis para o usuário logado (baseado no perfil). */
  availableContexts: NavigationContextType[];
}

const NavigationContext = createContext<NavigationContextData>(
  {} as NavigationContextData
);

/**
 * @provider NavigationProvider
 * @description Provedor que gerencia o estado de navegação global (Contextos).
 * Sincroniza o contexto ativo com a URL e o perfil do usuário.
 */
export const NavigationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { usuario } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * @memo availableContexts
   * Define quais contextos estão disponíveis baseado no perfil do usuário.
   */
  const availableContexts = useMemo((): NavigationContextType[] => {
    if (usuario?.perfil === 'ADMINISTRADOR' || usuario?.perfil === 'MASTER') {
      return ['VENDAS', 'FILA', 'GESTAO'];
    }
    // Atendente só vê Vendas e Fila
    return ['VENDAS', 'FILA'];
  }, [usuario]);

  /**
   * @function getContextFromPath
   * @description Determina o contexto ativo com base na rota atual (location.pathname).
   */
  const getContextFromPath = useCallback(
    (path: string): NavigationContextType => {
      const currentRoot = path.split('/')[1]; // Pega (vendas, fila, gestao)

      if (
        currentRoot === 'gestao' &&
        availableContexts.includes('GESTAO')
      ) {
        return 'GESTAO';
      }
      if (currentRoot === 'fila' && availableContexts.includes('FILA')) {
        return 'FILA';
      }
      // VENDAS é o padrão (catch-all)
      return 'VENDAS';
    },
    [availableContexts]
  );

  const [activeContext, setActiveContextState] = useState<NavigationContextType>(
    getContextFromPath(location.pathname)
  );

  /**
   * @effect
   * Sincroniza o contexto ativo com a URL sempre que a rota mudar.
   */
  useEffect(() => {
    const contextFromPath = getContextFromPath(location.pathname);
    if (contextFromPath !== activeContext) {
      setActiveContextState(contextFromPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, getContextFromPath]);

  /**
   * @function setActiveContext
   * @description Callback para mudar o contexto e navegar para a rota correspondente.
   */
  const setActiveContext = useCallback(
    (context: NavigationContextType) => {
      if (availableContexts.includes(context) && context !== activeContext) {
        setActiveContextState(context);
        
        // Navega para a rota base do novo contexto
        switch (context) {
          case 'VENDAS':
            navigate('/vendas');
            break;
          case 'FILA':
            navigate('/fila');
            break;
          case 'GESTAO':
            navigate('/gestao/relatorios'); // Rota padrão da gestão
            break;
          default:
            navigate('/vendas');
        }
      }
    },
    [availableContexts, navigate, activeContext]
  );

  const contextValue = useMemo(
    () => ({
      activeContext,
      setActiveContext,
      availableContexts,
    }),
    [activeContext, setActiveContext, availableContexts]
  );

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
};

/**
 * @hook useNavigation
 * @description Hook customizado para consumir o NavigationContext.
 * @returns {NavigationContextData} O estado e as funções de navegação por contexto.
 */
export const useNavigation = (): NavigationContextData =>
  useContext(NavigationContext);
