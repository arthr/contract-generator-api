import { IdentificadorCamposService } from '../../src/services/identificadorCampos.service';
import { DadosContrato } from '../../src/types';

describe('IdentificadorCamposService', () => {
  describe('identificarCampos', () => {
    it('deve identificar campos primário e secundário corretamente', () => {
      const dadosContrato: DadosContrato = {
        principal: [{
          nome_completo: 'Empresa Teste LTDA',
          cnpj: '12.345.678/0001-90',
          endereco: 'Rua Teste, 123',
          telefone: '(11) 99999-9999'
        }],
        variaveis: {}
      };

      const resultado = IdentificadorCamposService.identificarCampos(dadosContrato);

      expect(resultado).toEqual({
        primario: 'nome_completo',
        secundario: 'cnpj'
      });
    });

    it('deve retornar null quando não encontrar campos', () => {
      const dadosContrato: DadosContrato = {
        principal: [{
          endereco: 'Rua Teste, 123',
          telefone: '(11) 99999-9999'
        }],
        variaveis: {}
      };

      const resultado = IdentificadorCamposService.identificarCampos(dadosContrato);

      expect(resultado).toEqual({
        primario: null,
        secundario: null
      });
    });

    it('deve retornar null quando dadosContrato.principal estiver vazio', () => {
      const dadosContrato: DadosContrato = {
        principal: [],
        variaveis: {}
      };

      const resultado = IdentificadorCamposService.identificarCampos(dadosContrato);

      expect(resultado).toEqual({
        primario: null,
        secundario: null
      });
    });

    it('deve identificar campos com diferentes formatos de documento', () => {
      const dadosContrato: DadosContrato = {
        principal: [{
          razao_social: 'Empresa Teste ME',
          cpf: '123.456.789-00',
          cnpj: '12345678901234'
        }],
        variaveis: {}
      };

      const resultado = IdentificadorCamposService.identificarCampos(dadosContrato);

      expect(resultado).toEqual({
        primario: 'razao_social',
        secundario: 'cpf'
      });
    });
  });
}); 